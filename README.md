# Botigest POS

Sistema de Punto de Venta (POS) moderno y minimalista construido con Tauri + React.

## Características

- **Gestión de Inventario**: Productos, categorías, control de stock.
- **Punto de Venta (POS)**: Interfaz rápida, carrito de compras, múltiples métodos de pago.
- **Gestión de Clientes**: Base de datos de clientes, historial de compras.
- **Reportes**: Estadísticas de ventas diarias, por hora, y más.
- **Configuración**: Respaldo y restauración de base de datos, gestión de usuarios.
- **Diseño**: Interfaz "Kiosk-mode" pantalla completa, tema oscuro/claro.

## Requisitos Previos

Para ejecutar este proyecto en un nuevo computador, necesitas instalar:

1.  **Node.js**: [Descargar Node.js](https://nodejs.org/) (versión LTS recomendada).
2.  **Rust**: [Instalar Rust](https://www.rust-lang.org/tools/install).
3.  **Build Tools (Windows)**: Necesitas las "Herramientas de compilación de C++" de Visual Studio. Puedes instalarlas descargando el [Build Tools for Visual Studio](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

## Instalación

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/ovrdsz/botigest.git
    cd botigest
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

## Ejecución (Desarrollo)

Para iniciar la aplicación en modo de desarrollo:

```bash
npm run tauri dev
```

## Construcción (Producción)

Para generar el instalador (.exe / .msi):

```bash
npm run tauri build
```

## Base de Datos

La aplicación utiliza **SQLite**. La base de datos se crea automáticamente en la carpeta de datos de aplicación del usuario (`AppData/Roaming` en Windows) la primera vez que se ejecuta.

**Nota Importante**: La base de datos es local. Si cambias de computador, comenzarás con una base de datos vacía. Para transferir tus datos:
1.  Ve a **Configuración > Respaldo y Restauración** en el computador antiguo y crea un respaldo.
2.  Copia el archivo de respaldo al nuevo computador.
3.  Ve a **Configuración > Respaldo y Restauración** en el nuevo computador y restaura el archivo.
