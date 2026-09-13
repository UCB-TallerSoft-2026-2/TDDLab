export default function isWebKit(): boolean {
  const ua = navigator.userAgent;
  return ua.includes('AppleWebKit');
}
