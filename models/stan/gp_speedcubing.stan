// Modelo Bayesiano de Procesos Gaussianos con Censura para Speedcubing
// Basado e inspirado en la metodología de Sebastian Bitzer (2018)

data {
    int<lower=1> N;                  // Número de años evaluados
    int<lower=1> A;                  // Número total de atletas (reales + dummies)
    int<lower=1> AY;                 // Número de atletas evaluados por año (top_k, ej. 8)
    
    int<lower=1> athletes[N, AY];    // Matriz de atletas activos por año
    vector[N] records;               // Récord vigente en cada año (segundos)
    real years[N];                   // Vector de años (1982, 1983, ..., 2026)
    int<lower=0> recordsa[N];        // ID del atleta que batió el récord (0 si no hubo récord)
}

transformed data {
    real delta = 1e-9;               // Estabilidad numérica para la matriz de covarianza
}

parameters {
    real average;                    // Nivel medio global del evento
    real rho_raw;                    // Parámetro de escala temporal del kernel (longitud de correlación)
    real<lower=0> alpha;             // Varianza de la señal del proceso gaussiano
    vector[N] eta;                   // Variable latente estándar para descomposición de Cholesky

    real<lower=0> ability_std;       // Dispersión general de habilidades
    vector[A] abilities;             // Habilidad relativa de cada atleta (estandarizada)
    vector[A] astds_raw;             // Variabilidad individual de cada atleta (consistencia)
}

transformed parameters {
    // rho determina cuántos años abarca la correlación temporal (~10 a 20 años)
    real rho = exp(rho_raw + log(15));
    
    // Habilidad real del atleta b_a y su desviación estándar
    vector[A] ameans = abilities * ability_std;
    vector[A] astds = exp(astds_raw + log(0.2));
    
    // Función latente de evolución del rendimiento mundial f(t)
    vector[N] f;
    {
        matrix[N, N] L_K;
        matrix[N, N] K = cov_exp_quad(years, alpha, rho);
        
        // Agregar jitter a la diagonal para estabilidad positiva definida
        for (n in 1:N)
            K[n, n] = K[n, n] + delta;
            
        L_K = cholesky_decompose(K);
        f = L_K * eta;
    }
}

model {
    // Priors
    eta ~ normal(0, 1);
    alpha ~ normal(0, 3);
    rho_raw ~ normal(0, 1);

    // Prior para la media global (ajustado para speedcubing)
    average ~ normal(8, 4);
    
    ability_std ~ normal(0, 2);
    abilities ~ normal(0, 2);
    astds_raw ~ normal(0, 1);
    
    // Likelihood con Censura
    for (n in 1:N) {
        for (a in 1:AY) {
            int athlete = athletes[n, a];
            real amean = f[n] + average + ameans[athlete];
            
            if (recordsa[n] == athlete) {
                // Caso 1: Récord observado directamente en el año
                records[n] ~ normal(amean, astds[athlete]);
            } else {
                // Caso 2: Censura. El atleta compitió pero no bajó del récord vigente
                target += normal_lccdf(records[n] | amean, astds[athlete]);
            }
        }
    }
}
