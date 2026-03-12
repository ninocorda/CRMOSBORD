# Guía de Configuración Rápida - EdTech CRM

Para poner en marcha tu plataforma con tus propios datos, sigue estos 3 pasos:

### 1. Crear Proyecto en Supabase
1. Ve a [Supabase.com](https://supabase.com/) y crea un proyecto gratuito.
2. En el menú lateral, ve a **SQL Editor**.
3. Haz clic en **New Query**, pega el contenido del archivo `supabase_migration.sql` (que acabo de crear en la raíz de tu proyecto) y dale a **Run**.
   - Esto creará automáticamente todas las tablas (Alumnos, Cursos, Pagos) y las reglas de seguridad.

### 2. Configurar Variables de Entorno
1. En Supabase, ve a **Project Settings** > **API**.
2. Copia la **Project URL** y el **anon public key**.
3. Abre el archivo `.env.local` en tu editor y pega esos valores:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_llave_anon_aqui
   ```

### 3. Crear tu Usuario Admin
1. Ve a la página de `/register` en tu aplicación local.
2. Regístrate con tu correo.
3. **Paso importante**: Por defecto, los nuevos usuarios son 'student'. Para ser admin:
   - Ve a la tabla `profiles` en el dashboard de Supabase.
   - Busca tu registro y cambia la columna `role` a `admin`.
   - ¡Listo! Ya tendrás acceso total a todas las secciones.

¡La plataforma está lista para que empieces a cargar tus cursos y alumnos!
