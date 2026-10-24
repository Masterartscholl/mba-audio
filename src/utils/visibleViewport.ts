/**
 * Wix sayfasına gömülü (iframe) mobil görünümde iframe genellikle telefon ekranından uzundur.
 * `position: fixed` öğeler (oynatıcı, sepet çekmecesi) ekranın değil iframe'in alt/üst kenarına
 * yapışır ve kullanıcının görebildiği alanın dışında kalır.
 *
 * Cross-origin iframe içinden üst sayfanın scroll konumuna erişemeyiz, ama IntersectionObserver
 * iframe'in en üst seviyedeki viewport ile kesişimini (intersectionRect) verir. Tek büyük bir öğe
 * izlenseydi, görünen kısım kayarken oranı sabit kalır ve callback hiç tetiklenmezdi. Bu yüzden
 * iframe viewport'u küçük hücrelere bölünür; kenardaki hücrelerin oranı kayarken değişir.
 * Görünen aralık CSS değişkenlerine yazılır:
 *   --vv-top     iframe üstünden görünen alanın başlangıcına uzaklık
 *   --vv-height  görünen alanın yüksekliği
 *   --vv-bottom  iframe altından görünen alanın sonuna uzaklık
 *
 * Yalnızca iframe içinde ve mobil genişlikte (lg altı) çalışır; masaüstünde hiçbir şey yapmaz.
 * Değişkenleri kullanan CSS sınıfları globals.css içinde (`vv-bottom`, `vv-frame`).
 */

const MOBILE_QUERY = '(max-width: 1023px)';
const CELL_HEIGHT = 40;
// Hücre başına eşik sayısı = kenar hassasiyeti (CELL_HEIGHT / 20 = 2px).
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);
const VARS = ['--vv-top', '--vv-height', '--vv-bottom'] as const;

export function startVisibleViewportTracking(): () => void {
    if (typeof window === 'undefined' || window.self === window.top) return () => { };
    if (typeof IntersectionObserver === 'undefined') return () => { };

    const root = document.documentElement;
    const mq = window.matchMedia(MOBILE_QUERY);
    let stopTracking: (() => void) | null = null;

    const track = () => {
        const container = document.createElement('div');
        container.setAttribute('aria-hidden', 'true');
        container.style.cssText =
            'position:fixed;top:0;left:0;bottom:0;width:1px;pointer-events:none;opacity:0;overflow:hidden;';
        document.body.appendChild(container);

        let observer: IntersectionObserver | null = null;
        let frame = 0;
        // hücre -> son bilinen görünen aralık (iframe viewport koordinatları); görünmeyenler silinir
        const visible = new Map<Element, { top: number; bottom: number }>();

        const publish = () => {
            frame = 0;
            if (visible.size === 0) return; // iframe tamamen ekran dışı: eski değerleri koru
            let top = Infinity;
            let bottom = -Infinity;
            visible.forEach((r) => {
                top = Math.min(top, r.top);
                bottom = Math.max(bottom, r.bottom);
            });
            const frameHeight = window.innerHeight;
            root.style.setProperty('--vv-top', `${Math.round(top)}px`);
            root.style.setProperty('--vv-height', `${Math.round(bottom - top)}px`);
            root.style.setProperty('--vv-bottom', `${Math.max(0, Math.round(frameHeight - bottom))}px`);
        };

        const observe = () => {
            observer?.disconnect();
            visible.clear();
            container.replaceChildren();

            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((e) => {
                        if (e.intersectionRatio > 0) {
                            visible.set(e.target, { top: e.intersectionRect.top, bottom: e.intersectionRect.bottom });
                        } else {
                            visible.delete(e.target);
                        }
                    });
                    if (!frame) frame = requestAnimationFrame(publish);
                },
                { threshold: THRESHOLDS }
            );

            const count = Math.ceil(window.innerHeight / CELL_HEIGHT);
            for (let i = 0; i < count; i++) {
                const cell = document.createElement('div');
                cell.style.cssText = `position:absolute;left:0;top:${i * CELL_HEIGHT}px;width:1px;height:${CELL_HEIGHT}px;`;
                container.appendChild(cell);
                observer.observe(cell);
            }
        };

        observe();
        // Iframe yüksekliği değişince (Wix yeniden boyutlandırınca) hücreleri yeniden kur.
        window.addEventListener('resize', observe);

        return () => {
            window.removeEventListener('resize', observe);
            observer?.disconnect();
            if (frame) cancelAnimationFrame(frame);
            container.remove();
            VARS.forEach((v) => root.style.removeProperty(v));
        };
    };

    const sync = () => {
        if (mq.matches && !stopTracking) {
            stopTracking = track();
        } else if (!mq.matches && stopTracking) {
            stopTracking();
            stopTracking = null;
        }
    };

    sync();
    mq.addEventListener('change', sync);

    return () => {
        mq.removeEventListener('change', sync);
        stopTracking?.();
        stopTracking = null;
    };
}
