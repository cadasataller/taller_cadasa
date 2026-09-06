# Instrucciones del repositorio

Antes de crear o modificar cualquier archivo, valida Prettier usando el gestor de paquetes del proyecto:

1. Ejecuta `pnpm exec prettier --version`.
2. Si el comando devuelve una versión, Prettier está disponible y puedes continuar.
3. No uses `command -v prettier` ni exijas una instalación global.
4. Si falla, verifica que `prettier` exista en `devDependencies` o `dependencies` de `package.json`.
5. Si está declarado pero no funciona, pide al usuario ejecutar `pnpm install`.
6. Solo detente y solicita instalar Prettier con `pnpm add -D prettier` cuando no esté declarado en `package.json`.

Después de crear o modificar cualquier documento o archivo de código, formatéalo con:
`pnpm exec prettier --write <ruta-del-archivo>`.

cada que hagas un cambio valia si existe specs relaciodno luego de terminar la trea, si eciste pregutnar si acutalizas los specs sino hay valida cual es o si debe crear pregutna no lo hagas tu mismo

usa iconos de lucide icon

valida si tiene zod instalado, si lo tien cualquier logica de validacion que puedaser reempzlad por zod, sino esta instlado detente y pide que lo instale

si hay algun componente que usa input date usa la libreria vue date picker que esya instalado, sino lo esta detente y pide qye lo instale, adapta la logica de fecha que se neceati al date picker vue

nunca usas unknown o any, solo bajo estas condionces: aanlzia y si determinar ese uso detente y di que necesita para evitar que eso sea unknowe o any para poder tiparlo bien, si la repsuesta es no importa ntonces usa unknow o any si te dan un tipado o algo que permitar tiapr ntonces evita usar unknow o any

los tamaño con tailwidns debe generarse tomando en cuenta que mi app es un erp y el tamñao base es xs sm

prioriza a medida que haces la ui para web ir adaptando a mobile cada componente

agrega la clase cursor a cualquier boton o componente que emit eventos de selecion

cualquier inptu de lista o select debes usar vue multiselect

cualqeuri valor con fecha y hora utc debe ser formataedo por la fucion del archvio  [formatCompactPanamaDate.ts](c:/Users/arcel/OneDrive/Documents/GitHub/gestion-operativa/src/utils/formatCompactPanamaDate.ts) 
