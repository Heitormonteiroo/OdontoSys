/**
 * Hash SIMULADO (cyrb53, não criptográfico) para o protótipo guardar só o
 * "hash" do token do totem e do PIN, como o sistema real fará.
 * No sistema real: sha256 do token e argon2/bcrypt do PIN, sempre no servidor.
 * (Síncrono de propósito: crypto.subtle não existe em http pela rede local, ex.: tablet de teste.)
 */
export function hashSimulado(texto: string, semente = 0): string {
  let h1 = 0xdeadbeef ^ semente;
  let h2 = 0x41c6ce57 ^ semente;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

/** Token aleatório (base36) para o link de uso único do totem. */
export function gerarToken(bytes = 18): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(36).padStart(2, '0')).join('');
}
