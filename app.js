class IMDbApp {
    constructor() {
        this.currentPage = 'home';
        this.currentMovie = null;
        this.watchlist = JSON.parse(localStorage.getItem('imdb-watchlist')) || [];
        this.drinklist = JSON.parse(localStorage.getItem('wbdb-drinklist')) || [];
        this.reviews = {}; // keep as in-memory mapping, but load from project comments
        this.currentUser = localStorage.getItem('wbdb-user') || '';
        this.recentlyViewed = JSON.parse(localStorage.getItem('wbdb-recently-viewed')) || [];
        this.devicePref = localStorage.getItem('wbdb-device') || null;
        this.setupEventListeners();

        // apply device preference or show chooser
        if (this.devicePref) {
            this.applyDeviceClass(this.devicePref);
        } else {
            // show chooser overlay
            document.getElementById('deviceChoiceOverlay').hidden = false;
            // attach handlers (safe because DOM loaded)
            document.getElementById('chooseDesktop').addEventListener('click', () => this.setDevice('device-desktop'));
            document.getElementById('choosePhone').addEventListener('click', () => this.setDevice('device-phone'));
        }

        // load comments from project (shared) instead of relying solely on localStorage
        this.loadCommentsFromServer().then(() => {
            // subscribe to real-time comment created events so all clients update
            if (window.websim && window.websim.addEventListener) {
                window.websim.addEventListener('comment:created', (data) => {
                    this.handleIncomingCommentEvent(data);
                });
            }
            this.render();
        });
    }

    setDevice(deviceClass) {
        const remember = document.getElementById('rememberChoice') && document.getElementById('rememberChoice').checked;
        if (remember) {
            localStorage.setItem('wbdb-device', deviceClass);
            this.devicePref = deviceClass;
        }
        this.applyDeviceClass(deviceClass);
        document.getElementById('deviceChoiceOverlay').hidden = true;
    }

    applyDeviceClass(deviceClass) {
        document.body.classList.remove('device-desktop', 'device-phone');
        document.body.classList.add(deviceClass.replace('device-', 'device-'));
        // normalize: add simple classes 'device-desktop' or 'device-phone' to body
        if (deviceClass === 'device-desktop') {
            document.body.classList.add('device-desktop');
            document.body.classList.remove('device-phone');
        } else {
            document.body.classList.add('device-phone');
            document.body.classList.remove('device-desktop');
        }
        // small ARIA tweak: on phone prefer larger focus outlines
        if (deviceClass === 'device-phone') {
            document.body.setAttribute('data-touch', 'true');
        } else {
            document.body.removeAttribute('data-touch');
        }
    }

    // remove the old loadReviews/saveReviews flows and replace with server-backed ones
    async loadCommentsFromServer() {
        try {
            const project = await window.websim.getCurrentProject();
            const resp = await fetch(`/api/v1/projects/${project.id}/comments?first=100`);
            const json = await resp.json();
            const items = json.comments && json.comments.data ? json.comments.data : [];

            // clear existing reviews on movies
            for (let movie of movieDatabase) {
                movie.reviews = [];
            }

            // parse comments that follow the posting format "movie:<id>\n<name>|<rating>\n<review text>"
            for (const item of items) {
                const c = item.comment;
                if (!c || !c.raw_content) continue;
                const raw = c.raw_content.trim();

                // try to match the common pattern we will use when posting
                // pattern lines:
                // movie:<id>
                // name:<name>
                // rating:<1-10>
                // <blank line>
                // review text...
                const lines = raw.split(/\r?\n/);
                let meta = {};
                let bodyStart = 0;
                for (let i = 0; i < Math.min(6, lines.length); i++) {
                    const ln = lines[i].trim();
                    if (/^movie:\s*(\d+)/i.test(ln)) {
                        meta.movieId = Number(ln.match(/^movie:\s*(\d+)/i)[1]);
                        bodyStart = i + 1;
                        continue;
                    }
                    if (/^name:\s*(.+)/i.test(ln)) {
                        meta.name = ln.match(/^name:\s*(.+)/i)[1].trim();
                        bodyStart = i + 1;
                        continue;
                    }
                    if (/^rating:\s*(\d{1,2})/i.test(ln)) {
                        meta.rating = Number(ln.match(/^rating:\s*(\d{1,2})/i)[1]);
                        bodyStart = i + 1;
                        continue;
                    }
                    // stop if blank separator encountered
                    if (ln === '') {
                        bodyStart = i + 1;
                        break;
                    }
                }

                const reviewText = lines.slice(bodyStart).join('\n').trim();

                if (meta.movieId && meta.name && meta.rating && typeof reviewText === 'string') {
                    const movie = movieDatabase.find(m => m.id === meta.movieId);
                    if (movie) {
                        movie.reviews = movie.reviews || [];
                        movie.reviews.push({
                            name: meta.name,
                            rating: meta.rating,
                            text: reviewText,
                            timestamp: c.created_at || new Date().toISOString()
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Error loading comments from server, falling back to local cache', err);
            // fallback: if there are saved reviews in localStorage (older behavior), merge them so they don't disappear
            const saved = JSON.parse(localStorage.getItem('wbdb-reviews') || '{}');
            for (let movie of movieDatabase) {
                movie.reviews = saved[movie.id] || movie.reviews || [];
            }
        }
    }

    // handle incoming real-time comment events (comment:created) to append to movies immediately
    handleIncomingCommentEvent(data) {
        try {
            const c = data.comment;
            if (!c || !c.raw_content) return;
            const raw = c.raw_content.trim();
            const lines = raw.split(/\r?\n/);
            let meta = {};
            let bodyStart = 0;
            for (let i = 0; i < Math.min(6, lines.length); i++) {
                const ln = lines[i].trim();
                if (/^movie:\s*(\d+)/i.test(ln)) {
                    meta.movieId = Number(ln.match(/^movie:\s*(\d+)/i)[1]);
                    bodyStart = i + 1;
                    continue;
                }
                if (/^name:\s*(.+)/i.test(ln)) {
                    meta.name = ln.match(/^name:\s*(.+)/i)[1].trim();
                    bodyStart = i + 1;
                    continue;
                }
                if (/^rating:\s*(\d{1,2})/i.test(ln)) {
                    meta.rating = Number(ln.match(/^rating:\s*(\d{1,2})/i)[1]);
                    bodyStart = i + 1;
                    continue;
                }
                if (ln === '') {
                    bodyStart = i + 1;
                    break;
                }
            }
            const reviewText = lines.slice(bodyStart).join('\n').trim();
            if (meta.movieId && meta.name && meta.rating && typeof reviewText === 'string') {
                const movie = movieDatabase.find(m => m.id === meta.movieId);
                if (movie) {
                    movie.reviews = movie.reviews || [];
                    movie.reviews.push({
                        name: meta.name,
                        rating: meta.rating,
                        text: reviewText,
                        timestamp: c.created_at || new Date().toISOString()
                    });
                    this.render();
                }
            }
        } catch (e) {
            console.error('Failed to process incoming comment event', e);
        }
    }

    // override addReview to post via websim.postComment so it becomes visible project-wide
    async addReview(movieId, userName, rating, reviewText) {
        const content = [
            `movie:${movieId}`,
            `name:${userName}`,
            `rating:${rating}`,
            ``,
            reviewText
        ].join('\n');

        try {
            // postComment gives user a final edit prompt; it's OK per API docs
            await window.websim.postComment({
                content: content
            });

            // optimistically append to local movie reviews so UI updates immediately
            const movie = movieDatabase.find(m => m.id === movieId);
            if (movie) {
                movie.reviews = movie.reviews || [];
                movie.reviews.push({
                    name: userName,
                    rating: parseInt(rating, 10),
                    text: reviewText,
                    timestamp: new Date().toISOString()
                });
            }
            // persist a local cache in case of transient failures (not the source of truth)
            const reviewsData = {};
            for (let movie of movieDatabase) {
                reviewsData[movie.id] = movie.reviews || [];
            }
            localStorage.setItem('wbdb-reviews', JSON.stringify(reviewsData));
            this.render();
        } catch (err) {
            console.error('Failed to post comment via websim', err);
            alert('Could not post review. Please try again.');
        }
    }

    deleteReview(movieId, reviewIndex) {
        const movie = movieDatabase.find(m => m.id === movieId);
        if (!movie || !movie.reviews) return;
        const review = movie.reviews[reviewIndex];
        if (!review) return;
        // still only allow deletion of locally-posted reviews by the user (server-side deletion not available here)
        if (review.name !== this.currentUser) {
            alert('You can only delete your own reviews.');
            return;
        }
        // remove from local display and local cache. Note: we cannot delete the server comment via this client.
        movie.reviews.splice(reviewIndex, 1);
        const reviewsData = {};
        for (let m of movieDatabase) {
            reviewsData[m.id] = m.reviews || [];
        }
        localStorage.setItem('wbdb-reviews', JSON.stringify(reviewsData));
        this.render();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.handleSearch(e));
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                document.getElementById('searchResults').classList.remove('active');
            }
        });
        document.querySelector('.logo').addEventListener('click', () => this.navigateTo('home'));
    }

    // add missing helper methods for ratings and summaries
    calculateAverageRating(movie) { if (!movie || !movie.reviews || movie.reviews.length === 0) return null; const sum = movie.reviews.reduce((s, r) => s + Number(r.rating || 0), 0); return Math.round((sum / movie.reviews.length) * 10) / 10; }
    getRatingDistribution(movie) { const dist = Array.from({length:10}, ()=>0); (movie.reviews||[]).forEach(r=>{ const v = Math.min(10, Math.max(1, Math.round(Number(r.rating||0)))); dist[v-1]++; }); return dist; }

    handleSearch(e) {
        const query = e.target.value.toLowerCase();
        const resultsContainer = document.getElementById('searchResults');

        if (!query) {
            resultsContainer.classList.remove('active');
            return;
        }

        const results = movieDatabase.filter(movie =>
            movie.title.toLowerCase().includes(query)
        ).slice(0, 5);

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class=\"search-result-item\">No results found</div>';
        } else {
            resultsContainer.innerHTML = results.map(movie => `
                <div class=\"search-result-item\" onclick=\"app.navigateToMovie(${movie.id})\">
                    <img class=\"search-result-poster\" src=\"${movie.poster}\" alt=\"${movie.title}\">
                    <div class=\"search-result-info\">
                        <div class=\"search-result-title\">${movie.title}</div>
                        <div class=\"search-result-year\">${movie.year}</div>
                    </div>
                </div>
            `).join('');
        }

        resultsContainer.classList.add('active');
    }

    navigateTo(page) {
        this.currentPage = page;
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').classList.remove('active');
        this.render();
    }

    navigateToMovie(movieId) {
        this.currentMovie = movieDatabase.find(m => m.id === movieId);
        this.currentPage = 'detail';
        // manage recently viewed (most recent first, unique, max 6)
        this.recentlyViewed = this.recentlyViewed.filter(id => id !== movieId);
        this.recentlyViewed.unshift(movieId);
        if (this.recentlyViewed.length > 6) this.recentlyViewed.length = 6;
        localStorage.setItem('wbdb-recently-viewed', JSON.stringify(this.recentlyViewed));
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').classList.remove('active');
        this.render();
    }

    addToWatchlist(movieId) {
        if (!this.watchlist.includes(movieId)) {
            this.watchlist.push(movieId);
            localStorage.setItem('imdb-watchlist', JSON.stringify(this.watchlist));
            alert('Added to watchlist!');
        }
    }

    addToDrinklist(movieId) {
        if (!this.drinklist.includes(movieId)) {
            this.drinklist.push(movieId);
            localStorage.setItem('wbdb-drinklist', JSON.stringify(this.drinklist));
            alert('Added to Drinklist!');
            this.render();
        }
    }

    removeFromWatchlist(movieId) {
        this.watchlist = this.watchlist.filter(id => id !== movieId);
        localStorage.setItem('imdb-watchlist', JSON.stringify(this.watchlist));
        this.render();
    }

    removeFromDrinklist(movieId) {
        this.drinklist = this.drinklist.filter(id => id !== movieId);
        localStorage.setItem('wbdb-drinklist', JSON.stringify(this.drinklist));
        this.render();
    }

    // Toggle a movie in the user's Drinklist (adds or removes and re-renders)
    toggleDrinklist(movieId) {
        if (this.drinklist.includes(movieId)) {
            this.removeFromDrinklist(movieId);
        } else {
            this.addToDrinklist(movieId);
        }
    }

    renderHomePage() {
        const recentMovies = this.recentlyViewed.map(id => movieDatabase.find(m => m.id === id)).filter(Boolean);
        return `
            <div class="section">
                <div class="section-title">Featured Brands</div>
                <div class="movie-grid">
                    ${movieDatabase.slice(0, 6).map(movie => this.renderMovieCard(movie)).join('')}
                </div>
            </div>

            <div class="section">
                <div class="section-title">Top Picks</div>
                <div class="movie-grid">
                    ${movieDatabase.slice(1, 7).map(movie => this.renderMovieCard(movie)).join('')}
                </div>
            </div>

            <div class="section">
                <div class="section-title">Recently viewed</div>
                ${recentMovies.length ? `
                <div class="movie-grid">
                    ${recentMovies.map(movie => this.renderMovieCard(movie)).join('')}
                </div>
                ` : `
                <div class="recent-empty" style="padding:24px;background:var(--imdb-dark);border:1px solid var(--imdb-border);border-radius:4px;color:var(--imdb-text-muted);text-align:center;">
                    You haven't viewed any bottles yet.
                </div>
                `}
            </div>
        `;
    }

    renderMovieCard(movie) {
        const avgRating = this.calculateAverageRating(movie);
        const inDrinklist = this.drinklist.includes(movie.id);
        const ratingHtml = avgRating ? `
            <div class="movie-rating">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--imdb-yellow)"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                <span>${avgRating}</span>
            </div>` : `
            <div class="movie-rating">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--imdb-border)"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                <span>--</span>
            </div>`;
            
        return `
            <div class="movie-card" onclick="app.navigateToMovie(${movie.id})">
                <div class="movie-poster-container">
                    <img class="movie-poster" src="${movie.poster}" alt="${movie.title}" loading="lazy">
                    <div class="watchlist-ribbon ${inDrinklist ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleDrinklist(${movie.id})">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="${inDrinklist ? 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' : 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'}"></path></svg>
                    </div>
                </div>
                <div class="movie-card-info">
                    ${ratingHtml}
                    <div class="movie-title">${movie.title}</div>
                    <button class="movie-card-btn" onclick="event.stopPropagation(); app.toggleDrinklist(${movie.id})">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="vertical-align:middle;margin-right:4px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
                        Drinklist
                    </button>
                </div>
            </div>
        `;
    }

    renderDetailPage() {
        if (!this.currentMovie) return '';
        const movie = this.currentMovie;
        const inDrinklist = this.drinklist.includes(movie.id);
        const avgRating = this.calculateAverageRating(movie);
        const dist = this.getRatingDistribution(movie);
        const total = movie.reviews.length;

        return `
            <div class="detail-header-top">
                <h1>${movie.title}</h1>
                <div class="detail-header-meta">
                    <span>${movie.year}</span>
                    <span>${movie.runtime}</span>
                </div>
            </div>

            <div class="detail-hero">
                <img class="detail-hero-poster" src="${movie.poster}" alt="${movie.title}">
                <div class="detail-hero-main">
                    <img src="${movie.poster}" alt="background">
                    <div class="play-button-overlay">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="#fff"><path d="M8 5v14l11-7z"></path></svg>
                    </div>
                </div>
            </div>

            <div class="detail-container">
                <div class="detail-main-col">
                    <div class="detail-genres" style="margin-bottom:16px;">
                        ${movie.genre.map(g => `<span style="border:1px solid #444; padding:4px 12px; border-radius:16px; font-size:14px; margin-right:8px;">${g}</span>`).join('')}
                    </div>
                    
                    <p class="detail-description" style="font-size:18px; line-height:1.6; margin-bottom:24px;">${movie.description}</p>

                    <div class="detail-section" style="border-top:1px solid #333; padding:12px 0;">
                        <span class="detail-section-title" style="font-size:16px; color:#fff; display:inline-block; width:120px;">Manufacturer</span>
                        <span style="color:var(--imdb-blue); font-weight:700;">${movie.director}</span>
                    </div>

                    <div class="detail-section" style="border-top:1px solid #333; padding:12px 0;">
                        <span class="detail-section-title" style="font-size:16px; color:#fff; display:inline-block; width:120px;">Source</span>
                        <span style="color:var(--imdb-blue); font-weight:700;">${movie.source}</span>
                    </div>
                    
                    ${movie.tagline ? `
                    <div class="detail-section" style="border-top:1px solid #333; padding:12px 0; border-bottom:1px solid #333;">
                        <span class="detail-section-title" style="font-size:16px; color:#fff; display:inline-block; width:120px;">Tagline</span>
                        <span style="font-style:italic; color:var(--imdb-text-muted);">${movie.tagline}</span>
                    </div>` : ''}

                    <div class="cast-section">
                        <div class="section-title">Key Elements</div>
                        <div class="cast-grid">
                            ${(movie.cast || []).map(member => `
                                <div class="cast-item">
                                    <img src="${member.avatar}" class="cast-avatar" alt="${member.name}">
                                    <div class="cast-info">
                                        <div class="cast-name">${member.name}</div>
                                        <div class="cast-role">${member.role}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="detail-side-col">
                    <button class="btn" style="width:100%; margin-bottom:12px; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="app.toggleDrinklist(${movie.id})">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="${inDrinklist ? 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z' : 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'}"></path></svg>
                        ${inDrinklist ? 'In Drinklist' : 'Add to Drinklist'}
                    </button>
                    
                    <div style="background:var(--imdb-dark); padding:16px; border-radius:4px; border:1px solid var(--imdb-border);">
                        <div style="font-size:12px; color:var(--imdb-text-muted); text-transform:uppercase; margin-bottom:8px; font-weight:700;">WBDb Rating</div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <svg viewBox="0 0 24 24" width="32" height="32" fill="var(--imdb-yellow)"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>
                            <div>
                                <div style="font-size:20px; font-weight:700;">${avgRating ? `${avgRating}/10` : 'No reviews'}</div>
                                <div style="font-size:12px; color:var(--imdb-text-muted);">${total} reviews</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section-title">User reviews</div>
            <div class="reviews-section">
                <div class=\"user-reviews-header\">
                    <div class=\"user-reviews-left\">
                        <div class=\"large-star\">★</div>
                        <div class=\"large-score\">${avgRating ? avgRating : '--'}</div>
                        <div class=\"score-sub\">${total} reviews</div>
                    </div>
                    <div class=\"user-reviews-right\">
                        <div class=\"histogram\">
                            ${dist.map((count, idx) => {
                                const percent = total === 0 ? 0 : Math.round((count / total) * 100);
                                return `
                                    <div class="hist-row">
                                        <div class="hist-label">${idx+1}</div>
                                        <div class="hist-bar-outer"><div class="hist-bar-inner" style="width:${percent}%"></div></div>
                                        <div class="hist-count">${count}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Summary section removed -->

                <div class=\"add-review-form\">
                    <h3>Add Your Review</h3>
                    <input type=\"text\" id=\"reviewName\" placeholder=\"Your name\" class=\"review-input\">
                    <div class=\"rating-input\">
                        <label>Rating:</label>
                        <select id=\"reviewRating\" class=\"review-select\">
                            <option value=\"\">Select rating</option>
                            <option value=\"1\">1 - Poor</option>
                            <option value=\"2\">2</option>
                            <option value=\"3\">3</option>
                            <option value=\"4\">4</option>
                            <option value=\"5\">5</option>
                            <option value=\"6\">6</option>
                            <option value=\"7\">7</option>
                            <option value=\"8\">8</option>
                            <option value=\"9\">9</option>
                            <option value=\"10\">10 - Excellent</option>
                        </select>
                    </div>
                    <textarea id=\"reviewText\" placeholder=\"Write your review...\" class=\"review-textarea\"></textarea>
                    <button class=\"btn\" onclick=\"app.submitReview(${movie.id})\">Submit Review</button>
                </div>

                ${movie.reviews.length > 0 ? `
                    <div class=\"reviews-list\">
                        ${movie.reviews.map((review, idx) => `
                            <div class=\"review-item\">
                                <div class=\"review-header\">
                                    <div style="display:flex;align-items:center;gap:10px;">
                                        <div class=\"review-name\">${review.name}</div>
                                        <div class=\"review-timestamp\">${new Date(review.timestamp).toLocaleString()}</div>
                                    </div>
                                    <div class=\"review-rating\">★ ${review.rating}/10</div>
                                </div>
                                <div class=\"review-text\">${review.text}</div>
                                <div style="margin-top:8px;">
                                    ${review.name === (this.currentUser || '') ? `<button class="btn" onclick="event.stopPropagation(); app.deleteReview(${movie.id}, ${idx});">Delete Review</button>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<div class="no-reviews">No reviews yet. Be the first to review!</div>'}
            </div>
        `;
    }

    submitReview(movieId) {
        const name = document.getElementById('reviewName').value.trim();
        const rating = document.getElementById('reviewRating').value;
        const text = document.getElementById('reviewText').value.trim();

        if (!name) {
            alert('Please enter your name');
            return;
        }
        if (!rating) {
            alert('Please select a rating');
            return;
        }
        if (!text) {
            alert('Please write a review');
            return;
        }

        // persist current user so delete permissions persist across pages/sessions
        this.currentUser = name;
        localStorage.setItem('wbdb-user', name);

        // post to shared project comments (and update local UI optimistically)
        this.addReview(movieId, name, rating, text);
    }

    renderTop250Page() {
        return `
            <h1 class=\"section-title\">Top 250 Movies</h1>
            <div class=\"top250-grid\">
                ${movieDatabase.map((movie, index) => `
                    <div class=\"movie-card-with-rank\" onclick=\"app.navigateToMovie(${movie.id})\">
                        <div class=\"rank-badge\">${index + 1}</div>
                        <img class=\"movie-poster\" src=\"${movie.poster}\" alt=\"${movie.title}\">
                        <div class=\"movie-title\">${movie.title}</div>
                        <div class=\"movie-year\">${movie.year}</div>
                        <div class=\"movie-rating\">★ ${movie.rating}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderWatchlistPage() {
        if (this.watchlist.length === 0) {
            return `
                <div class=\"watchlist-empty\">
                    <div class=\"watchlist-empty-title\">Your Watchlist is Empty</div>
                    <p>Start adding movies to your watchlist!</p>
                    <button class=\"btn\" onclick=\"app.navigateTo('home')\" style=\"margin-top: 20px;\">Browse Movies</button>
                </div>
            `;
        }

        const watchlistMovies = movieDatabase.filter(m => this.watchlist.includes(m.id));
        return `
            <h1 class=\"section-title\">My Watchlist</h1>
            <div class=\"watchlist-grid\">
                ${watchlistMovies.map(movie => `
                    <div class=\"movie-card\" onclick=\"app.navigateToMovie(${movie.id})\">
                        <img class=\"movie-poster\" src=\"${movie.poster}\" alt=\"${movie.title}\">
                        <div class=\"movie-title\">${movie.title}</div>
                        <div class=\"movie-year\">${movie.year}</div>
                        <div class=\"movie-rating\">★ ${movie.rating}</div>
                        <button class=\"btn\" onclick=\"event.stopPropagation(); app.removeFromWatchlist(${movie.id})\" style=\"margin-top: 8px; width: 100%;\">Remove</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderDrinklistPage() {
        if (this.drinklist.length === 0) {
            return `
                <div class="watchlist-empty">
                    <div class="watchlist-empty-title">Your Drinklist is Empty</div>
                    <p>Add bottles to your Drinklist to keep track of favorites.</p>
                    <button class="btn" onclick="app.navigateTo('home')" style="margin-top: 20px;">Browse Brands</button>
                </div>
            `;
        }

        const drinklistMovies = movieDatabase.filter(m => this.drinklist.includes(m.id));
        return `
            <h1 class="section-title">My Drinklist</h1>
            <div class="watchlist-grid">
                ${drinklistMovies.map(movie => `
                    <div class="movie-card" onclick="app.navigateToMovie(${movie.id})">
                        <img class="movie-poster" src="${movie.poster}" alt="${movie.title}">
                        <div class="movie-title">${movie.title}</div>
                        <div class="movie-year">${movie.year}</div>
                        <div class="movie-rating">★ ${movie.rating}</div>
                        <button class="btn" onclick="event.stopPropagation(); app.removeFromDrinklist(${movie.id})" style="margin-top: 8px; width: 100%;">Remove</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    render() {
        const content = document.getElementById('mainContent');
        let html = '';

        switch (this.currentPage) {
            case 'home':
                html = this.renderHomePage();
                break;
            case 'detail':
                html = this.renderDetailPage();
                break;
            case 'drinklist':
                html = this.renderDrinklistPage();
                break;
        }

        content.innerHTML = html;
    }
}

const app = new IMDbApp();