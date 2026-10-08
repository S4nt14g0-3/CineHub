'use client';

// ============================================================
// Contexto de autenticación global.
// Mantiene el usuario logueado, expone login/registro/logout y
// persiste la sesión en localStorage para que sobreviva al recargar.
// ============================================================

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  api,
  setToken,
  clearToken,
  getToken,
  getUsuarioGuardado,
  setUsuarioGuardado,
} from '@/lib/api';

const AuthContext = createContext(null);

// Nombres de rol según la tabla `roles` del backend.
export const ROLES = { CLIENTE: 1, EMPLEADO: 2, ADMINISTRADOR: 3 };

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // `cargando` evita redirecciones antes de leer la sesión guardada.
  const [cargando, setCargando] = useState(true);

  // Al montar, recuperamos la sesión persistida (si el token sigue existiendo).
  // Se hace dentro de una IIFE async para no actualizar estado de forma
  // síncrona dentro del efecto.
  useEffect(() => {
    (async () => {
      if (getToken()) {
        const guardado = getUsuarioGuardado();
        if (guardado) setUsuario(guardado);
      }
      setCargando(false);
    })();
  }, []);

  // Guarda token y usuario en un solo paso.
  const guardarSesion = useCallback((data) => {
    setToken(data.token);
    setUsuarioGuardado(data.usuario);
    setUsuario(data.usuario);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await api.post('/auth/login', { email, password });
      guardarSesion(data);
      return data.usuario;
    },
    [guardarSesion]
  );

  const registro = useCallback(
    async (payload) => {
      const data = await api.post('/auth/registro', payload);
      guardarSesion(data);
      return data.usuario;
    },
    [guardarSesion]
  );

  const logout = useCallback(() => {
    clearToken();
    setUsuario(null);
  }, []);

  // Ruta inicial sugerida según el rol del usuario autenticado.
  const homePorRol = useCallback((u = usuario) => {
    if (!u) return '/';
    if (u.rol_id === ROLES.ADMINISTRADOR) return '/admin';
    if (u.rol_id === ROLES.EMPLEADO) return '/empleado';
    return '/';
  }, [usuario]);

  const value = { usuario, cargando, login, registro, logout, homePorRol };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook de acceso al contexto; falla si se usa fuera del provider.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

/* ============================================================
   QUÉ SABER DE ESTE ARCHIVO
   - El provider debe envolver toda la app (ver src/app/layout.js).
   - useAuth() devuelve: { usuario, cargando, login, registro, logout, homePorRol }.
   - usuario tiene { id, nombre, email, rol_id, rol }.
   - homePorRol() sugiere a qué panel mandar a cada rol tras el login.
   ============================================================ */
