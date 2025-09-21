// identity.service.ts
import { Injectable } from '@angular/core';

function uuid(): string {
  // Use native when available
  if ((crypto as any)?.randomUUID) return (crypto as any).randomUUID();
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

@Injectable({ providedIn: 'root' })
export class IdentityService {
  private readonly LS_KEY = 'ek_anon_id';

  get id(): string {
    let id = localStorage.getItem(this.LS_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(this.LS_KEY, id);
      document.cookie = `ek_anon_id=${id}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
    return id;
  }

  reset() {
    localStorage.removeItem(this.LS_KEY);
    document.cookie = 'ek_anon_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  }
}
