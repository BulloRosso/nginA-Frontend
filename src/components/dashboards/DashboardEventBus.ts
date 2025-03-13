// src/components/dashboard/DashboardEventBus.tsx

class DashboardEventBus {
  private listeners: { [event: string]: Array<(data: any) => void> };

  constructor() {
    this.listeners = {};
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (listener) => listener !== callback
      );
    }
  }

  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((listener) => listener(data));
    }
  }
}

const eventBus = new DashboardEventBus();
export default eventBus;