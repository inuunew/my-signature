const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const apiClient = axios.create({
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
    }
});

// Header ala browser (dari versi Go: Sec-Ch-Ua, Sec-Fetch-*, dst)
function browserHeaders(referer) {
    const h = {
        'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
    };
    if (referer) h['Referer'] = referer;
    return h;
}

// ID perangkat acak untuk request player_ajax
function makeDid() {
    return 'k_' + (BigInt(Date.now()) * 1000000n).toString(16) + process.pid;
}

// Ambil field dari objek JS/JSON hasil decode script base64
function parseJsObject(segment) {
    const clean = segment.trim().replace(/;$/, '');
    try {
        return JSON.parse(clean);
    } catch (e) {
        const out = {};
        const re = /["']?(\w+)["']?\s*:\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^,}\s]+))/g;
        let m;
        while ((m = re.exec(clean)) !== null) {
            out[m[1]] = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : m[4]);
        }
        return out;
    }
}

class ScraperEngine {
    // Cache jadwal rilis (5 menit)
    scheduleCache = null;

    // Cache daftar episode per series (10 menit) agar halaman stream tetap cepat
    episodeCache = new Map();

    async fetchHTML(targetURL) {
        const response = await apiClient.get(targetURL);
        return response.data;
    }

                async extractGenres(targetURL) {
        try {
            const html = await this.fetchHTML(targetURL);
            const $ = cheerio.load(html);
            const genresList = [];

            // Selector presisi langsung menembak class 'genre-grid-card'
            $('a.genre-grid-card').each((i, el) => {
                const $el = $(el);
                
                const targetHref = $el.attr('href');
                const genreName = $el.find('h3.genre-name').text().trim();
                const thumb = $el.find('.card-thumbnail img').attr('src');
                
                // Mengambil teks "Total 115 Series" dan mengekstrak angkanya saja
                const totalText = $el.find('.detail-item.count').text().trim();
                let totalSeries = "-";
                const numMatch = totalText.match(/\d+/);
                if (numMatch) {
                    totalSeries = numMatch[0];
                }

                // Validasi agar data kosong tidak masuk
                if (targetHref && genreName) {
                    genresList.push({
                        name: genreName,
                        url: targetHref,
                        thumbnail: thumb,
                        totalSeries: totalSeries,
                        ongoingSeries: "-" // Di snippet tidak ada data ongoing, kita set default
                    });
                }
            });

            return {
                success: true,
                data: {
                    isGenrePage: true,
                    genresList: genresList
                }
            };
        } catch (error) {
            console.error("Gagal extract genres page:", error.message);
            return { success: false, data: null, error: error.message };
        }
    }




    async extractData(targetURL) {
        try {
            const html = await this.fetchHTML(targetURL);
            const $ = cheerio.load(html);

            const isEpisodeUrl = (targetURL.includes('-episode-') || targetURL.includes('/episode/')) && !targetURL.includes('/anime/');
            // Film/OVA: halaman streaming di /<slug>/ tanpa kata "episode", dikenali dari daftar server player
            const hasPlayer = !targetURL.includes('/anime/') && $('.kotak_player_option').length > 0;
            const isEpisode = isEpisodeUrl || hasPlayer;
            const isHome = targetURL === 'https://s13.nontonanimeid.boats' || targetURL === 'https://s13.nontonanimeid.boats/';
            const isSearch = targetURL.includes('?s=');
            const isGenre = targetURL.includes('/genres/') || targetURL.includes('/genre/');

            if (isEpisode) {
                return await this.extractEpisode($, targetURL, html);
            } else if (isHome || isSearch || isGenre) {
                return await this.extractHome($, targetURL);
            } else {
                return this.extractSeries($, targetURL);
            }
        } catch (error) {
            console.error("Scraping Error:", error.message);
            return { success: false, data: null, error: error.message };
        }
    }

    // Jadwal rilis dari /jadwal-rilis/ (pengumuman, perkiraan rilis, kalender per hari)
    async extractSchedule() {
        if (this.scheduleCache && Date.now() - this.scheduleCache.at < 5 * 60 * 1000) {
            return this.scheduleCache.result;
        }

        try {
            const html = await this.fetchHTML('https://s13.nontonanimeid.boats/jadwal-rilis/');
            const $ = cheerio.load(html);
            const normalize = (t) => (t || '').replace(/\s+/g, ' ').trim();
            // teks tanpa ikon emoji (<span class="icon">)
            const textOnly = ($el) => normalize($el.clone().children('.icon').remove().end().text());

            const parseLi = ($li) => {
                const strong = normalize($li.find('strong').first().text());
                const full = normalize($li.text());
                const rest = strong ? normalize(full.replace(strong, '')).replace(/^:\s*/, '') : full;
                return { title: strong.replace(/:\s*$/, ''), text: rest };
            };

            const announcements = [];
            $('.as-delay-announcements li').each((i, li) => { announcements.push(parseLi($(li))); });
            const notes = [];
            $('.as-important-notes li').each((i, li) => { notes.push(parseLi($(li))); });

            const upcoming = [];
            $('.jr-upcoming-list .jr-upcoming-item').each((i, el) => {
                const $el = $(el);
                const title = normalize($el.find('.jr-upcoming-title').text());
                if (!title) return;
                upcoming.push({
                    title,
                    episode: normalize($el.find('.jr-upcoming-ep').text()),
                    countdown: normalize($el.find('.jr-upcoming-time').text()),
                    thumbnail: $el.find('img').first().attr('src') || ''
                });
            });

            const days = [];
            $('.jr-kalender-days .jr-kalender-day').each((i, el) => {
                const $el = $(el);
                const id = $el.attr('data-tab');
                if (!id) return;
                days.push({
                    id,
                    name: normalize($el.find('.jr-day-name').text()),
                    date: normalize($el.find('.jr-day-date').text()),
                    month: normalize($el.find('.jr-day-month').text()),
                    active: $el.hasClass('active'),
                    dateText: '',
                    items: []
                });
            });

            days.forEach((day) => {
                const $panel = $('#' + day.id);
                day.dateText = $panel.attr('data-date-text') || '';
                $panel.find('.as-anime-card').each((i, card) => {
                    const $c = $(card);
                    const href = $c.attr('href');
                    const title = normalize($c.find('.as-anime-title').text());
                    if (!href || !title) return;

                    const rating = textOnly($c.find('.rating-text'));
                    const members = textOnly($c.find('.members-text'));
                    const genres = [];
                    $c.find('.jr-genre-pill').each((j, g) => { genres.push(normalize($(g).text())); });

                    day.items.push({
                        title,
                        url: href,
                        thumbnail: $c.find('.as-card-thumbnail img').attr('src') || '',
                        episode: normalize($c.find('.jr-ep-text').text()),
                        type: normalize($c.find('.jr-type-badge').text()),
                        time: textOnly($c.find('.time-text')),
                        rating: rating === '-' ? '' : rating,
                        members: members === '-' ? '' : members,
                        delayed: $c.attr('data-status') === 'delayed',
                        delayText: textOnly($c.find('.delay-text')),
                        genres
                    });
                });
            });

            const widthMatch = ($('.as-progress-bar-fill').attr('style') || '').match(/width:\s*([\d.]+)%/);
            const season = {
                name: normalize($('.as-season-name').first().text()),
                percent: normalize($('.as-season-percentage').first().text()),
                width: widthMatch ? parseFloat(widthMatch[1]) : 0
            };

            if (days.length === 0) {
                return { success: false, data: null, error: 'Struktur jadwal tidak ditemukan' };
            }

            const result = { success: true, data: { isSchedule: true, season, announcements, notes, upcoming, days } };
            this.scheduleCache = { at: Date.now(), result };
            return result;
        } catch (e) {
            console.error("Gagal ambil jadwal rilis:", e.message);
            return { success: false, data: null, error: e.message };
        }
    }

    async extractHome($, targetURL) {
        const results = [];
        const genres = [];

        const isHomePage = targetURL === 'https://s13.nontonanimeid.boats' || targetURL === 'https://s13.nontonanimeid.boats/';

        $('article.animeseries, .as-anime-card, .result .archive .as-anime-card').each((i, el) => {
            const $el = $(el);
            
            // --- TAMBAHKAN KODE INI UNTUK MENYARING IKLAN ---
            const isAd = $el.hasClass('widget-ads') || $el.hasClass('sponsor') || $el.find('.ads-banner').length > 0;
            if (isAd) return; // Lewati elemen jika terdeteksi iklan
            // ----------------------------------------------

            const linkSel = $el.is('a') ? $el : $el.find('a').first();
            const targetHref = linkSel.attr('href');
            
            const title = $el.find('.title').text().trim() || $el.find('h3').text().trim();

            const thumb = $el.find('img').attr('src');
            const ep = $el.find('.types.episodes, .as-card-episode').text().trim();
            const rating = $el.find('.score, .rating, .numscore').text().trim() || null;
            const synopsis = $el.find('.sinopsis, .synopsis, .desc, p').text().trim() || "";

            // --- PASTIKAN LINK TIDAK MENGANDUNG UNSUR IKLAN/JUDI ---
            if (targetHref && title && !targetHref.includes('topup') && !targetHref.includes('slot')) {
                results.push({ title, url: targetHref, episodeNumber: ep, thumbnail: thumb, rating, synopsis });
            }
        });

        // Ada halaman berikutnya? (rel=next dari Rank Math, tombol next, atau halaman penuh)
        const hasNext = $('link[rel="next"]').length > 0 ||
            $('a.next, a.nextpostslink, .pagination a[rel="next"]').length > 0 ||
            results.length >= 15;

        // ---- Data tambahan beranda (disesuaikan dengan struktur HTML asli situs) ----
        const topRated = [];
        const seasonal = { title: '', items: [] };
        const homeTabs = [];

        if (isHomePage) {
            const normalize = (t) => (t || '').replace(/\s+/g, ' ').trim();
            const isBadLink = (h) => !h || h.includes('topup') || h.includes('slot');

            // Sidebar kanan: "Top Rating Anime" dan "Series Popular <musim>"
            $('#sidebar_right .side').each((i, el) => {
                const $side = $(el);
                const heading = normalize($side.find('h3.sidebar-title').first().text());

                if (/top\s*rating/i.test(heading)) {
                    $side.find('ul.latestepisodes li a').each((j, a) => {
                        const $a = $(a);
                        const href = $a.attr('href');
                        if (isBadLink(href) || topRated.find(t => t.url === href)) return;
                        const title = normalize($a.find('.lefts').text());
                        const rank = (normalize($a.find('.rights').text()).match(/#\s*(\d+)/) || [])[1] || '';
                        if (title) topRated.push({ title, url: href, rank });
                    });
                } else if (/popular/i.test(heading) && $side.find('a.popseries').length > 0) {
                    seasonal.title = heading.replace(/^Series\s+Popular\s*/i, 'Populer ');
                    $side.find('a.popseries').each((j, a) => {
                        if (seasonal.items.length >= 12) return false;
                        const $a = $(a);
                        const href = $a.attr('href');
                        if (isBadLink(href) || seasonal.items.find(t => t.url === href)) return;
                        const $img = $a.find('img').first();
                        seasonal.items.push({
                            title: normalize($img.attr('alt') || $a.attr('title')),
                            url: href,
                            thumbnail: $img.attr('data-src') || $img.attr('src') || ''
                        });
                    });
                }
            });

            // Tab "Series Terbaru (Movie/TV)", "Popular Series (Semua)", "Popular Genre (Romance)"
            let group = null;
            $('#series-footer ul.tabs1 li').each((i, li) => {
                const $li = $(li);
                if ($li.is('.boxtab, .boxtab1')) {
                    group = { title: normalize($li.text()), tabs: [] };
                    homeTabs.push(group);
                } else if ($li.hasClass('tab-link') && group) {
                    const id = $li.attr('data-tab1');
                    const items = [];
                    $('#' + id + ' .animeseries').each((j, card) => {
                        const $c = $(card);
                        const href = $c.find('a').first().attr('href');
                        if (isBadLink(href)) return;
                        const $img = $c.find('img').first();
                        const title = normalize($c.find('.title span').first().text()) || normalize($img.attr('alt'));
                        const rawScore = normalize($c.find('.kotakscore').text());
                        if (title) {
                            items.push({
                                title,
                                url: href,
                                thumbnail: $img.attr('data-src') || $img.attr('src') || '',
                                rating: /\d/.test(rawScore) ? rawScore : ''
                            });
                        }
                    });
                    group.tabs.push({ id, label: normalize($li.text()), items });
                }
            });

            // Buang tab kosong dan grup tanpa tab
            homeTabs.forEach(g => { g.tabs = g.tabs.filter(t => t.items.length > 0); });
            for (let i = homeTabs.length - 1; i >= 0; i--) {
                if (homeTabs[i].tabs.length === 0) homeTabs.splice(i, 1);
            }
        }

        $('.genre-info a, ul.genres li a, .tax-res a').each((i, el) => {
             const name = $(el).text().trim();
             const link = $(el).attr('href');
             if (name && link && link.includes('/genres/')) {
                 if (!genres.find(g => g.name === name)) {
                     genres.push({ name, url: link });
                 }
             }
        });

        return { 
            success: true, 
            data: {
                isHome: isHomePage,
                catalog: results,
                genres: genres,
                hasNext: hasNext,
                topRated: topRated,
                seasonal: seasonal,
                homeTabs: homeTabs
            } 
        };
    }

    extractSeries($, pageURL = '') {
        const data = {
            // Ambil judul asli dari atribut data-title-default agar bersih dari kata "Nonton" & "Sub Indo"
            title: $('h1.entry-title span[data-title-default]').attr('data-title-default') || $('h1.entry-title').text().replace(/Nonton|Sub Indo/g, '').trim(),
            
            thumbnail: $("meta[property='og:image']").attr('content') || $(".anime-card__sidebar img").attr('src') || "",
            
            // Rating ada di dalam <span class="value"> di bawah .anime-card__score
            rating: $('.anime-card__score .value').first().text().trim() || "-",
            
            type: $('.anime-card__score .type').first().text().trim() || "-",
            
            // Status ada di dalam <span class="info-item status-airing">
            status: $('.anime-card__quick-info .status-airing').text().replace('Currently Airing', 'Ongoing').trim() || "-",
            
            studio: "-",
            released: "-",
            
            // Sinopsis dibungkus di dalam <div class="synopsis-prose">
            synopsis: $('.synopsis-prose').text().trim() || "Sinopsis belum tersedia.",
            
            details: [],
            quickInfo: [],
            trailer: "",
            genres: [],
            episodes: [],
            related: []
        };

        // Ambil detail seperti Studio dan Tanggal Rilis (Aired) dari <ul class="details-list">
        $('.details-list li').each((i, el) => {
            const label = $(el).find('.detail-label').text().toLowerCase().trim();
            const textContent = $(el).text().trim();
            
            if (label.includes('studios')) {
                data.studio = textContent.replace(/Studios:/i, '').trim();
            }
            if (label.includes('aired')) {
                data.released = textContent.replace(/Aired:/i, '').trim();
            }
        });

        // Semua baris detail (English, Synonyms, Studios, Rating, Popularity, Members, Aired, dst)
        $('.detail-label').each((i, el) => {
            const label = $(el).text().replace(/:\s*$/, '').replace(/\s+/g, ' ').trim();
            const full = $(el).parent().text().replace(/\s+/g, ' ').trim();
            const value = full.replace(new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:?\\s*', 'i'), '').trim();
            if (label && value && !data.details.find(d => d.label === label)) {
                data.details.push({ label, value });
            }
        });

        // Info singkat: status tayang, jumlah episode, durasi, musim
        $('.anime-card__quick-info .info-item').each((i, el) => {
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            if (text) data.quickInfo.push(text);
        });

        // Link trailer YouTube (selector khusus trailer dulu, baru pola URL video)
        data.trailer =
            $('[class*="trailer"] a[href*="youtu"]').first().attr('href') ||
            $('a[class*="trailer"]').first().attr('href') ||
            $('[data-trailer]').first().attr('data-trailer') ||
            $('[data-trailer-url]').first().attr('data-trailer-url') ||
            $('a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[href*="youtube.com/embed/"]').first().attr('href') ||
            $('iframe[src*="youtube.com/embed"]').first().attr('src') ||
            "";

        // Ambil Genre dari <a class="genre-tag">
        $('.anime-card__genres .genre-tag').each((i, el) => {
            const name = $(el).text().trim();
            const url = $(el).attr('href');
            if (name && url && !data.genres.find(g => g.name === name)) {
                data.genres.push({ name, url });
            }
        });

        // ---- Pisahkan EPISODE asli dari anime TERKAIT ----
        // Episode : /one-piece-episode-1164/   (tanpa /anime/)
        // Terkait : /anime/one-piece-film-strong-world-episode-0/  (halaman anime lain)
        const toPath = (u) => (u || '').replace(/https?:\/\/[^\/]+/, '').replace(/\/+$/, '');
        const isAnimePath = (p) => /^\/anime\/[^\/]+/.test(p);
        const selfPath = toPath(
            pageURL || $('link[rel="canonical"]').attr('href') || $('meta[property="og:url"]').attr('content') || ''
        );
        const DATE_RE = /\s+((?:Jan|Feb|Mar|Apr|Mei|May|Jun|Jul|Agu|Aug|Sep|Okt|Oct|Nov|Des|Dec)[a-z]*\.?\s+\d{1,2},\s+\d{4})\s*$/i;
        const epNumberOf = (u) => { const m = (u || '').match(/-episode-(\d+)/); return m ? parseInt(m[1], 10) : null; };

        // Bersihkan judul: buang awalan "Pertama"/"Terbaru" dan pisahkan tanggal
        const cleanEpTitle = (t) => {
            let title = (t || '').replace(/\s+/g, ' ').trim().replace(/^(Pertama|Terbaru|First|Latest)\s+/i, '');
            let date = '';
            const m = title.match(DATE_RE);
            if (m) { date = m[1]; title = title.slice(0, m.index).trim(); }
            return { title, date };
        };

        const addEpisode = (link, rawTitle, rawDate) => {
            const c = cleanEpTitle(rawTitle);
            const date = rawDate || c.date;
            const exist = data.episodes.find(e => e.url === link);
            if (exist) {
                if (!exist.date && date) exist.date = date;
                return;
            }
            if (c.title) data.episodes.push({ title: c.title, url: link, date });
        };

        const addRelated = ($node, link) => {
            const path = toPath(link);
            if (!isAnimePath(path) || path === selfPath) return;
            if (data.related.find(r => toPath(r.url) === path)) return;

            const text = $node.text().replace(/\s+/g, ' ').trim();
            let title = $node.find('.title, .as-card-title, h3, h2').first().text().replace(/\s+/g, ' ').trim();
            if (!title) {
                const m = text.match(/^(.*?)\s*⭐/);
                title = (m ? m[1] : text).trim();
            }
            if (!title) return;

            const rating = $node.find('.score, .rating, .numscore').first().text().trim() ||
                (text.match(/⭐\s*([\d.]+|N\/A)/) || [])[1] || '';
            const type = (text.match(/📺\s*(.+?)\s*📅/) || [])[1] || '';
            const synopsis = $node.find('.sinopsis, .synopsis, .desc, p').first().text().replace(/\s+/g, ' ').trim();
            const $img = $node.find('img').first();
            const thumbnail = $img.attr('data-src') || $img.attr('data-lazy-src') || $img.attr('src') || '';

            data.related.push({ title, url: link, thumbnail, rating, type, synopsis });
        };

        $('.episodelist ul li, .series-chapterlist li, .eplister ul li, div.eplister li, .lister ul li, ul.daftarep li').each((i, el) => {
            const $el = $(el);
            const $anchor = $el.is('a') ? $el : $el.find('a').first();
            const link = $anchor.attr('href');
            if (!link) return;

            if (isAnimePath(toPath(link))) {
                addRelated($el, link);
                return;
            }
            if (link.includes('-episode-') || link.includes('/episode/')) {
                const epTitle = $el.find('.epl-num, .episodetitle, .title').text().trim() || $anchor.text().trim();
                const epDate = $el.find('.epl-date, .date').text().trim();
                addEpisode(link, epTitle, epDate);
            }
        });

        // Fallback cadangan jika selector di atas kosong
        if (data.episodes.length === 0) {
            $('a[href*="-episode-"]').each((i, el) => {
                const link = $(el).attr('href');
                if (!link || isAnimePath(toPath(link))) return; // anime terkait ditangani di bawah
                addEpisode(link, $(el).text().trim(), '');
            });
        }

        // Anime terkait: kartu berlink /anime/<slug> di luar header/nav/footer
        $('a[href*="/anime/"]').each((i, el) => {
            if (data.related.length >= 12) return false;
            const $a = $(el);
            if ($a.closest('header, nav, footer').length) return;
            addRelated($a, $a.attr('href'));
        });

        // Urutkan episode dari yang terbaru bila semua punya nomor
        if (data.episodes.length > 0 && data.episodes.every(e => epNumberOf(e.url) !== null)) {
            data.episodes.sort((a, b) => epNumberOf(b.url) - epNumberOf(a.url));
        }

        return { success: true, data };
    }


    // Minta embed URL ke admin-ajax (kini mengirim parameter "did")
    async resolvePlayerAjax(ajaxUrl, postId, nume, serverType, nonce, pageURL) {
        try {
            const formData = new URLSearchParams();
            formData.append('action', 'player_ajax');
            formData.append('post', postId);
            formData.append('nume', nume);
            formData.append('serverName', serverType);
            formData.append('nonce', nonce);
            formData.append('did', makeDid());

            const res = await apiClient.post(ajaxUrl, formData.toString(), {
                headers: {
                    ...browserHeaders(pageURL),
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': 'https://s13.nontonanimeid.boats'
                }
            });
            const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
            const iframeMatch = body.match(/src=["']([^"']+)["']/);
            return iframeMatch ? iframeMatch[1] : "";
        } catch (e) {
            console.error("Gagal resolve player_ajax:", e.message);
            return "";
        }
    }

    // Bongkar embed kotakanimeid.link untuk mendapatkan link m3u8 langsung
    async decryptEmbedM3U8(embedURL, referer) {
        try {
            const res = await apiClient.get(embedURL, { headers: browserHeaders(referer) });
            const html = typeof res.data === 'string' ? res.data : String(res.data);

            const payload = html.match(/_w\[\s*['"]at['"]\s*\+\s*['"]ob['"]\s*\]\(([\s\S]*?)\);var /);
            if (!payload) return "";

            let raw = payload[1].trim();
            if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
                raw = raw.slice(1, -1);
            }
            const cleanB64 = raw.replace(/['"]\s*\+\s*['"]/g, '');

            const arrayMatch = html.match(/var s=['"]([0-9,]+)['"]/);
            const calcMatch = html.match(/parseInt\(s\[j\],10\)\s*-\s*(\d+)\s*\*\s*\(j\s*\+\s*(\d+)\)/);
            if (!arrayMatch || !calcMatch) return "";

            const multiplier = parseInt(calcMatch[1], 10);
            const offset = parseInt(calcMatch[2], 10);
            const key = Buffer.from(
                arrayMatch[1].split(',').map((t, j) => (parseInt(t, 10) - multiplier * (j + offset)) & 255)
            );

            const cipher = Buffer.from(cleanB64, 'base64');
            if (key.length === 0 || cipher.length === 0) return "";

            const plain = Buffer.alloc(cipher.length);
            for (let i = 0; i < cipher.length; i++) {
                plain[i] = cipher[i] ^ key[i % key.length];
            }
            const code = plain.toString('utf8');

            const fileRe = /"file"\s*:\s*"(https?:(?:\\?\/){2}[^"]+)"/g;
            let m;
            while ((m = fileRe.exec(code)) !== null) {
                if (!m[1].includes('blank.mp4')) return m[1].replace(/\\\//g, '/');
            }

            const m3u8 = code.match(/https?:(?:\\?\/){2}[^"'\s]+?\.m3u8/);
            if (m3u8 && !m3u8[0].includes('blank.mp4')) return m3u8[0].replace(/\\\//g, '/');

            return "";
        } catch (e) {
            console.error("Gagal decrypt embed m3u8:", e.message);
            return "";
        }
    }

    async getSeriesEpisodes(seriesUrl) {
        if (!seriesUrl) return [];
        const hit = this.episodeCache.get(seriesUrl);
        if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.list;

        try {
            const html = await this.fetchHTML(seriesUrl);
            const $s = cheerio.load(html);
            const res = this.extractSeries($s, seriesUrl);
            const list = ((res.data && res.data.episodes) || []).map(e => ({ title: e.title, url: e.url }));
            if (list.length > 0) this.episodeCache.set(seriesUrl, { at: Date.now(), list });
            return list;
        } catch (e) {
            console.error("Gagal ambil daftar episode series:", e.message);
            return [];
        }
    }

    async extractEpisode($, pageURL, html) {
        const data = {
            episodeTitle: $('h1.entry-title, .name, title').first().text().trim(),
            episodeURL: pageURL,
            thumbnail: $(".featuredimgs img").attr("src") || $("meta[property='og:image']").attr("content") || "",
            prevURL: $(".naveps .nvs a[title*='Prev'], .naveps .nvs a:contains('Prev')").attr("href"),
            nextURL: $(".naveps .nvs a[title*='Next'], .naveps .nvs a:contains('Next')").attr("href"),
            seriesId: "",
            seriesTitle: "",
            seriesUrl: "",
            episodeNumber: "",
            streams: [],
            episodeList: []
        };

        let nonce = "";
        let ajaxUrl = "https://s13.nontonanimeid.boats/wp-admin/admin-ajax.php";
        const scriptMatches = html.match(/data:text\/javascript;base64,([A-Za-z0-9+/=]+)/g);

        if (scriptMatches) {
            for (let match of scriptMatches) {
                const b64 = match.replace('data:text/javascript;base64,', '');
                const decoded = Buffer.from(b64, 'base64').toString('utf-8');

                if (decoded.includes('kotakajax')) {
                    try {
                        const parsed = parseJsObject(decoded.split('var kotakajax=')[1]);
                        if (parsed.nonce) nonce = parsed.nonce;
                        if (parsed.url) ajaxUrl = parsed.url;
                    } catch (e) {}
                }

                if (decoded.includes('episodeToTrack')) {
                    try {
                        const track = parseJsObject(decoded.split('var episodeToTrack=')[1]);
                        data.seriesId = track.seriesId || "";
                        data.seriesTitle = track.seriesTitle || "";
                        data.seriesUrl = track.seriesUrl || "";
                        data.episodeNumber = track.episodeNumber || "";
                        if (!data.thumbnail && track.poster) data.thumbnail = track.poster;
                    } catch (e) {}
                }
            }
        }

        const streamElements = $('.kotak_player_option').toArray();
        for (let el of streamElements) {
            const $el = $(el);
            const serverName = $el.text().trim() || $el.attr('data-type');

            const postId = $el.attr('data-post');
            const nume = $el.attr('data-nume');
            const type = $el.attr('data-type');
            let embedURL = "";
            let directStream = "";

            if (nonce && postId && nume) {
                embedURL = await this.resolvePlayerAjax(ajaxUrl, postId, nume, type, nonce, pageURL);
                if (embedURL.includes('kotakanimeid.link')) {
                    directStream = await this.decryptEmbedM3U8(embedURL, pageURL);
                }
            }

            if (embedURL) {
                data.streams.push({ serverName, embedURL, directStream, postId, nume, type, nonce, pageURL });
            }
        }

        // Daftar episode untuk pemilih episode (diambil dari halaman series)
        data.episodeList = await this.getSeriesEpisodes(data.seriesUrl);

        return { success: true, data };
    }
}

const engine = new ScraperEngine();

app.get('/', async (req, res) => {
    const result = await engine.extractData('https://s13.nontonanimeid.boats');
    res.render('layout', { body: 'index', result });
});

app.get('/search', async (req, res) => {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;

    if (!query) return res.redirect('/');

    let targetURL;
    if (page > 1) {
        targetURL = `https://s13.nontonanimeid.boats/page/${page}/?s=${encodeURIComponent(query)}`;
    } else {
        targetURL = `https://s13.nontonanimeid.boats/?s=${encodeURIComponent(query)}`;
    }

    const result = await engine.extractData(targetURL);

    // Jaga-jaga jika result.data null / gagal dari scraper
    if (!result.data) {
        result.data = {
            isHome: false,
            catalog: [],
            popular: [],
            genres: []
        };
    }

    // Selalu set metadata search
    result.data.searchQuery = query;
    result.data.currentPage = page;

    res.render('layout', { body: 'index', result });
});


// Rute untuk halaman utama daftar semua genre (sesuaikan URL sumber jika berbeda)
app.get('/genres', async (req, res) => {
    const targetURL = 'https://s13.nontonanimeid.boats/genres/'; // Ganti dengan URL halaman list genre target
    const result = await engine.extractGenres(targetURL);
    res.render('layout', { body: 'genres', result });
});


app.get('/genres/:genreName', async (req, res) => {
    const genre = req.params.genreName;
    const page = parseInt(req.query.page) || 1;
    
    // Konfigurasi URL target dengan pagination
    let targetURL = `https://s13.nontonanimeid.boats/genres/${genre}/`;
    if (page > 1) {
        targetURL = `https://s13.nontonanimeid.boats/genres/${genre}/page/${page}/`;
    }
    
    const result = await engine.extractData(targetURL);
    
    if (result.success && result.data) {
        // Merapikan format nama genre (misal: "detective" jadi "Detective")
        const displayGenre = genre.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Suntikkan data tambahan untuk ditangkap EJS
        result.data.pageTitle = `Genre: ${displayGenre}`;
        result.data.currentGenre = genre;
        result.data.currentPage = page;
        // Asumsikan ada halaman selanjutnya jika item yang dimuat cukup banyak
        result.data.hasNextPage = typeof result.data.hasNext === 'boolean'
            ? result.data.hasNext
            : !!(result.data.catalog && result.data.catalog.length > 0);
    }

    res.render('layout', { body: 'index', result });
});


// Library = bookmark + riwayat (data disimpan di localStorage browser)
app.get('/library', (req, res) => {
    res.render('layout', { body: 'library', result: { success: true, data: {} } });
});
app.get('/bookmarks', (req, res) => res.redirect('/library#bookmark'));
app.get('/history', (req, res) => res.redirect('/library#history'));

// Jadwal rilis (diambil dari /jadwal-rilis/ situs sumber)
app.get('/schedule', async (req, res) => {
    const result = await engine.extractSchedule();
    res.render('layout', { body: 'schedule', result });
});

// Pengaturan (nanti: pindah mode donghua/komik/novel & tampilan)
app.get('/settings', (req, res) => {
    res.render('layout', { body: 'settings', result: { success: true, data: {} } });
});

app.get('/get-stream', async (req, res) => {
    const { post, nume, type, pageUrl, nonce } = req.query;
    const ajaxUrl = "https://s13.nontonanimeid.boats/wp-admin/admin-ajax.php";

    let embedURL = "";
    let directStream = "";

    if (nonce && post && nume) {
        embedURL = await engine.resolvePlayerAjax(ajaxUrl, post, nume, type, nonce, pageUrl || 'https://s13.nontonanimeid.boats/');
        if (embedURL.includes('kotakanimeid.link')) {
            directStream = await engine.decryptEmbedM3U8(embedURL, pageUrl || 'https://s13.nontonanimeid.boats/');
        }
    }

    res.json({ success: !!embedURL, embedURL, directStream });
});

// ---- Render halaman detail / streaming dengan fallback yang jelas ----
const prettifySlug = (slug) => String(slug || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const isEmptySeries = (d) => !d || (!d.title && (!d.episodes || d.episodes.length === 0));

function renderPage(res, result, { section, slug }) {
    const data = (result && result.success) ? result.data : null;

    // Halaman streaming (episode, film, OVA)
    if (data && Array.isArray(data.streams)) {
        return res.render('layout', { body: 'watch', result });
    }
    // Daftar katalog (genre/search yang kebetulan lewat route ini)
    if (data && data.catalog !== undefined) {
        return res.render('layout', { body: 'index', result });
    }
    // Detail series yang isinya ada
    if (data && !isEmptySeries(data)) {
        return res.render('layout', { body: 'series', result });
    }

    // Detail tidak ada: arahkan langsung ke streaming (/slug) bila ini halaman /anime/<slug>
    const noDetail = section === 'anime';
    res.status(noDetail ? 200 : 404).render('layout', {
        body: 'nodetail',
        result: { success: false, data: { mode: noDetail ? 'nodetail' : 'notfound', slug, title: prettifySlug(slug) } }
    });
}

app.get('/:section/:slug', async (req, res) => {
    const { section, slug } = req.params;
    const targetURL = `https://s13.nontonanimeid.boats/${encodeURIComponent(section)}/${encodeURIComponent(slug)}/`;

    const result = await engine.extractData(targetURL);
    renderPage(res, result, { section, slug });
});

app.get('/:slug', async (req, res) => {
    const slug = req.params.slug;
    // abaikan permintaan file statis (favicon.ico, robots.txt, dll)
    if (/\.[a-z0-9]{2,4}$/i.test(slug)) return res.status(404).end();

    const targetURL = `https://s13.nontonanimeid.boats/${encodeURIComponent(slug)}/`;
    const result = await engine.extractData(targetURL);
    renderPage(res, result, { section: '', slug });
});

// Vercel: export app sebagai handler serverless.
// Lokal: tetap bisa dijalankan dengan `npm start`.
module.exports = app;

if (require.main === module) {
    const PORT = process.env.SERVER_PORT || process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Node.js Web Scraper berjalan di port ${PORT}`);
    });
}
