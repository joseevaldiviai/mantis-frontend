/**
 * Servicio de notificaciones push del navegador + persistencia backend.
 * Muestra notificaciones nativas del OS Y guarda historial en la API.
 */
import { api } from './api';

// ─── Browser Push Notifications ───

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

let audioCtx: AudioContext | null = null;

function playNotificationSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;

    // First tone: 880Hz (A5) for 120ms
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 880;
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc1.connect(gain1).connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Second tone: 1320Hz (E6) for 150ms, delayed 100ms
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 1320;
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.25, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc2.connect(gain2).connect(audioCtx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.25);
  } catch {
    // Silently fail if audio not supported
  }
}

export function sendPushNotification(title: string, body: string, icon?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  // Play sound
  playNotificationSound();

  new Notification(title, {
    body,
    icon: icon || '/logo-icon.png',
    badge: '/logo-icon.png',
    tag: `mantis-${Date.now()}`,
    requireInteraction: false,
  });
}

// ─── Backend Notification Persistence ───

async function saveToBackend(tipo: string, mensaje: string, data?: Record<string, unknown>) {
  try {
    await api.createNotification({ tipo, mensaje, data });
  } catch {
    // Silently fail — browser push still works
  }
}

async function saveBulkToBackend(tipo: string, mensaje: string, userIds: number[], data?: Record<string, unknown>) {
  try {
    await api.createBulkNotifications({ tipo, mensaje, data, user_ids: userIds });
  } catch {
    // Silently fail
  }
}

// ─── Composite: Push + Backend ───

// Notificación de nueva OT creada
export function notifyNewWorkOrder(numero: string, maquina: string, prioridad: string) {
  const title = `🔧 Nueva OT: ${numero}`;
  const body = `Máquina: ${maquina} | Prioridad: ${prioridad}`;
  sendPushNotification(title, body);
  saveToBackend('nueva_ot', title + ' — ' + body, { numero, maquina, prioridad });
}

// Notificación de OT asignada a un técnico
export function notifyOTAssigned(numero: string, maquina: string, userIds: number[]) {
  const title = `👷 OT asignada: ${numero}`;
  const body = `Máquina: ${maquina} - Revisa tus órdenes de trabajo`;
  sendPushNotification(title, body);
  saveBulkToBackend('ot_asignada', title + ' — ' + body, userIds, { numero, maquina });
}

// Notificación de cambio en catálogo
export function notifyCatalogChange(tipo: string, accion: string, detalle: string) {
  const title = `📋 Catálogo actualizado: ${tipo}`;
  const body = `${accion}: ${detalle}`;
  sendPushNotification(title, body);
  saveToBackend('catalogo_change', title + ' — ' + body, { tipo, accion, detalle });
}

// Notificación de cambio en configuración
export function notifyConfigChange(detalle: string) {
  const title = `⚙️ Configuración actualizada`;
  const body = detalle;
  sendPushNotification(title, body);
  saveToBackend('config_change', title + ' — ' + body, { detalle });
}

// Notificación de estado de OT cambiado
export function notifyStatusChange(numero: string, nuevoEstado: string) {
  const title = `🔄 OT ${numero} actualizada`;
  const body = `Nuevo estado: ${nuevoEstado}`;
  sendPushNotification(title, body);
  saveToBackend('estado_change', title + ' — ' + body, { numero, nuevoEstado });
}

// Verificar permiso al cargar
export function initPushNotifications() {
  // No solicitar automáticamente
}
