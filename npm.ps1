# Wrapper de npm usando Docker para entornos sin Node.js local en Windows
param(
    [Parameter(ValueFromRemainingArguments=$true)]
    $RemainingArgs
)

# Detectar puerto a exponer si es de desarrollo
$ports = @()
if ($RemainingArgs -contains "start" -or $RemainingArgs -contains "start:dev" -or $RemainingArgs -contains "dev") {
    $ports = @("-p", "3000:3000")
}

# Ejecutar npm en un contenedor node temporal
docker run --rm -it -v "${PWD}:/app" -w /app $ports node:20-alpine npm $RemainingArgs
