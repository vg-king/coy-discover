export function avatarUrl(id: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(id)}&backgroundColor=e6dfff,c9f4df,ffd6e6`;
}
