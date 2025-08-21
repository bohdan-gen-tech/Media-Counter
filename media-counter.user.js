// ==UserScript==
// @name         Media Counter
// @namespace    http://tampermonkey.net/
// @version      2025.08.22.1
// @description  Fixed dimensions according to DPR value. Added copy URL button by clicking on media emoji of tooltip. Won't run in iframe.
// @author       Bohdan S.
// @match        *://*/*
// @icon         https://cdn-icons-png.flaticon.com/256/15271/15271482.png
// @grant        none
// @updateURL    https://raw.githubusercontent.com/bohdan-gen-tech/Media-Counter/main/media-counter.user.js
// @downloadURL  https://raw.githubusercontent.com/bohdan-gen-tech/Media-Counter/main/media-counter.user.js
// ==/UserScript==

(function () {
    'use strict';

    if (window.self !== window.top) {
        return;
    }

    /**
     * @eng Main function to initialize the entire script after the DOM is ready.
     */
    function initializeScript() {
        // --- CONFIGURATION ---
        const config = {
            storageKeys: {
                position: 'mediaCounterPosition',
                collapsed: 'mediaCounterCollapsed',
                tooltipEnabled: 'mediaCounterTooltipEnabled',
            },
        };

        // --- STYLES ---
        const styles = `
            @keyframes green-flash {
                0% {
                    transform: scale(1.1);
                    color: #fff;
                    text-shadow: 0 0 8px #fff, 0 0 15px #2ecc71;
                }
                50% {
                    transform: scale(1.35);
                    color: #2ecc71;
                    text-shadow: 0 0 12px #fff, 0 0 25px #2ecc71, 0 0 35px #2ecc71;
                }
                100% {
                    transform: scale(1.2);
                    color: #2ecc71;
                    text-shadow: 0 0 10px rgba(46, 204, 113, 0.7);
                }
            }
            .media-info-panel-vFinal { position: fixed; bottom: 20px; right: 20px; background-color: rgba(0,0,0,0.7); color: #fff; border-radius: 8px; font-family: monospace; font-size: 13px; z-index: 99998; text-align: left; min-width: 270px; border: 1px solid #555; backdrop-filter: blur(8px); overflow: hidden; }
            .media-panel-header { display: flex; align-items: center; justify-content: space-between; background: #111; padding: 0 0 0 15px; margin: 0; border-bottom: 1px solid #444; height: 25px; cursor: move; user-select: none; }
            .media-panel-header-title { font-weight: bold; font-size: 10px;}
            .media-panel-controls { display: flex; align-items: center; height: 100%; }
            .media-panel-header-btn { border: none; background: transparent; color: #aaa; cursor: pointer; padding: 0 6px; line-height: 1; transition: opacity 0.2s, color 0.3s, transform 0.1s ease; }
            .media-panel-header-btn[data-action="unblur-all"] { font-size: 9px; transform: translateY(1px); }
            .media-panel-header-btn[data-action="unblur-all"]:active { transform: translateY(2px) scale(0.75); }
            .media-panel-header-btn[data-action="toggle-tooltip"] { font-size: 15px; transform: translateY(-1px); }
            .media-panel-header-btn[data-action="toggle-collapse"] { font-size: 16px; }
            .media-panel-header-btn[data-action="close"] { font-size: 18px; }
            .media-panel-body { padding: 8px 15px; }
            .media-panel-body hr { border: none; border-top: 1px solid #555; margin: 6px 0; }
            .media-panel-body small { color: #ccc; font-weight: bold; }
            b.counter-link { cursor: pointer; text-decoration: underline; font-weight: bold; }
            .media-link-tooltip-vFinal { position: fixed; display: none; background-color: rgba(0, 0, 0, 0.85); color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px; z-index: 99999; max-width: 450px; line-height: 1.5; font-family: monospace; }
            .media-link-tooltip-vFinal a { color: #fff !important; text-decoration: none !important; }
            .media-link-tooltip-vFinal .tooltip-line { display: flex; align-items: flex-start; }
            .media-link-tooltip-vFinal .tooltip-icon { margin-right: 5px; flex-shrink: 0; line-height: 1.4; }
            .media-link-tooltip-vFinal .copy-icon { cursor: pointer; display: inline-block; transition: transform 0.2s ease, text-shadow 0.2s ease; user-select: none; }
            .media-link-tooltip-vFinal .copy-icon:hover { transform: scale(1.8); text-shadow: 0 0 6px rgba(255, 255, 255, 0.7), 0 0 12px rgba(52, 152, 219, 0.6); }
            .media-link-tooltip-vFinal .copy-icon:active { transform: scale(0.5); text-shadow: 0 0 2px rgba(255, 255, 255, 0.5), 0 0 28px rgba(52, 152, 219, 1); }
            .media-link-tooltip-vFinal .copy-icon.copied { animation: green-flash 1s ease-out forwards; }
            .media-link-tooltip-vFinal .tooltip-content { word-break: break-all; }
            .media-link-tooltip-vFinal .tooltip-filesize { color: #ccc; font-style: italic; margin-left: 8px; white-space: nowrap; }
            .media-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 100000; display: none; align-items: center; justify-content: center; }
            .media-modal-content { background: #fff; color: #333; border-radius: 8px; width: 90%; max-width: 800px; height: 80%; display: flex; flex-direction: column; font-family: sans-serif; }
            .media-modal-header { padding: 10px 15px; font-size: 18px; font-weight: bold; border-bottom: 1px solid #eee; }
            .media-modal-close { float: right; cursor: pointer; font-size: 24px; line-height: 1; }
            .media-modal-body { padding: 15px; overflow-y: auto; flex-grow: 1; }
            .media-list-item { display: flex; align-items: flex-start; border-bottom: 1px solid #f0f0f0; padding: 10px 0; }
            .media-list-preview { width: 80px; height: 60px; object-fit: cover; margin-right: 15px; border-radius: 4px; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
            .media-list-details { display: flex; flex-direction: column; flex-grow: 1; gap: 5px; }
            .media-list-link { word-break: break-all; font-size: 12px; margin-bottom: 5px; }
            .media-list-link a { color: #0056b3; }
            .media-list-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 5px 15px; font-size: 11px; color: #555; }
        `;
        document.head.insertAdjacentHTML('beforeend', `<style>${styles.replace(/\s\s+/g, ' ')}</style>`);

        // --- UI ELEMENT CREATION & STATE ---
        const infoPanel = document.createElement('div');
        infoPanel.className = 'media-info-panel-vFinal';
        infoPanel.dataset.userscriptUi = 'true';
        document.body.appendChild(infoPanel);
        let isPanelCollapsed = JSON.parse(localStorage.getItem(config.storageKeys.collapsed)) || false;
        let isTooltipEnabled = JSON.parse(localStorage.getItem(config.storageKeys.tooltipEnabled)) ?? true;
        let performanceMap = new Map();
        infoPanel.innerHTML = `
            <div class="media-panel-header" data-handle="drag">
                <span class="media-panel-header-title">Media Counter</span>
                <div class="media-panel-controls">
                    <button class="media-panel-header-btn" data-action="unblur-all" title="Unblur All">👀</button>
                    <button class="media-panel-header-btn" data-action="toggle-tooltip" title="Toggle Tooltip">◎</button>
                    <button class="media-panel-header-btn" data-action="toggle-collapse" title="${isPanelCollapsed ? 'Expand' : 'Collapse'}">${isPanelCollapsed ? '⊞' : '−'}</button>
                    <button class="media-panel-header-btn" data-action="close" title="Close">×</button>
                </div>
            </div>
            <div class="media-panel-body" style="display: ${isPanelCollapsed ? 'none' : 'block'};">
                <div><small>On Screen:</small><br>
                🖼️ Images: <b class="counter-link" data-type="view-img" data-title="Images on Screen">0</b> (pre-gen: <b class="counter-link" data-type="view-pregen-img" data-title="Pre-gen Images on Screen">0</b>)<br>
                📹 Videos: <b class="counter-link" data-type="view-vid" data-title="Videos on Screen">0</b> (pre-gen: <b class="counter-link" data-type="view-pregen-vid" data-title="Pre-gen Videos on Screen">0</b>)</div>
                <hr>
                <div><small>Hidden on Page:</small><br>
                🖼️ Images: <b class="counter-link" data-type="hidden-img" data-title="Hidden Images">0</b> (pre-gen: <b class="counter-link" data-type="hidden-pregen-img" data-title="Hidden Pre-gen Images">0</b>)<br>
                📹 Videos: <b class="counter-link" data-type="hidden-vid" data-title="Hidden Videos">0</b> (pre-gen: <b class="counter-link" data-type="hidden-pregen-vid" data-title="Hidden Pre-gen Videos">0</b>)</div>
                <hr>
                <div><small>All on Page (On Screen + Hidden):</small><br>
                🖼️ Images: <b class="counter-link" data-type="all-img" data-title="All Images on Page">0</b> (pre-gen: <b class="counter-link" data-type="all-pregen-img" data-title="All Pre-gen Images on Page">0</b>)<br>
                📹 Videos: <b class="counter-link" data-type="all-vid" data-title="All Videos on Page">0</b> (pre-gen: <b class="counter-link" data-type="all-pregen-vid" data-title="All Pre-gen Videos on Page">0</b>)</div>
                 <hr>
                <div><small>Alternative Sources (srcset):</small><br>
                🖼️ Images: <b class="counter-link" data-type="srcset-img" data-title="Alternative Image Sources">0</b></div>
                <hr>
                <div><small>Preloaded (not rendered):</small><br>
                🖼️ Images: <b class="counter-link" data-type="preload-img" data-title="Preloaded Images">0</b></div>
            </div>
        `;
        const panelBody = infoPanel.querySelector('.media-panel-body');
        const counterElements = {};
        infoPanel.querySelectorAll('.counter-link').forEach(el => { counterElements[el.dataset.type] = el; });
        const tooltip = document.createElement('div');
        tooltip.className = 'media-link-tooltip-vFinal';
        tooltip.dataset.userscriptUi = 'true';
        document.body.appendChild(tooltip);
        const modal = document.createElement('div');
        modal.className = 'media-modal-overlay';
        modal.dataset.userscriptUi = 'true';
        modal.innerHTML = `<div class="media-modal-content"><div class="media-modal-header"><span class="media-modal-close">&times;</span><span class="media-modal-title"></span></div><div class="media-modal-body"></div></div>`;
        document.body.appendChild(modal);
        const modalTitle = modal.querySelector('.media-modal-title');
        const modalBody = modal.querySelector('.media-modal-body');

        const colorizeUrl = (url) => { const rules = [ { regex: /(nsfw)/gi, color: '#e74c3c' }, { regex: /(swf)/gi, color: '#2ecc71' }, { regex: /(pre[_-]?gen)/gi, color: '#2ecc71' }, { regex: /(chat[_-]?generated)/gi, color: '#f1c40f' }, { regex: /(welcome)/gi, color: '#5dade2' }, { regex: /(cover)/gi, color: '#9b59b6' }, { regex: /(person[_-]?models)/gi, color: '#3498db' } ]; let coloredUrl = url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); for (const rule of rules) { coloredUrl = coloredUrl.replace(rule.regex, (match) => `<span style="color: ${rule.color}; font-weight: bold;">${match}</span>`); } return coloredUrl; };
        const isElementInViewport = (el) => { if (!el.isConnected) return false; const style = window.getComputedStyle(el); if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return false; if (el.offsetWidth < 2 && el.offsetHeight < 2) return false; const rect = el.getBoundingClientRect(); return rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0; };

                const refreshPerformanceMap = () => { const performanceEntries = window.performance.getEntriesByType('resource'); performanceMap = new Map(performanceEntries.map(entry => [entry.name, entry])); };

        /**
         * Reliably gets the final, correct data for a media element by loading its
         * current source into an in-memory object to get its actual dimensions.
         */
        const getMediaData = (el) => {
            return new Promise((resolve) => {
                const isImg = el.tagName === 'IMG';
                const src = el.currentSrc || el.src;

                const data = {
                    src: src,
                    isImg: isImg,
                    renderedWidth: el.offsetWidth,
                    renderedHeight: el.offsetHeight,
                    naturalWidth: 0,
                    naturalHeight: 0,
                };

                if (isImg && src) {
                    const checker = new Image();
                    checker.onload = () => {
                        data.naturalWidth = checker.naturalWidth;
                        data.naturalHeight = checker.naturalHeight;
                        resolve(data);
                    };
                    checker.onerror = () => {
                        // On error, resolve with what we have, dimensions will be 0
                        resolve(data);
                    };
                    checker.src = src;
                } else if (!isImg) { // Handle Video
                    if (el.readyState >= 1) { // HAVE_METADATA
                        data.naturalWidth = el.videoWidth;
                        data.naturalHeight = el.videoHeight;
                        resolve(data);
                    } else {
                        el.addEventListener('loadedmetadata', () => {
                            data.naturalWidth = el.videoWidth;
                            data.naturalHeight = el.videoHeight;
                            resolve(data);
                        }, { once: true });
                        el.addEventListener('error', () => resolve(data), { once: true });
                    }
                } else {
                    resolve(data); // No src or not a valid media element
                }
            });
        };

        const populateAndShowModal = async (dataType, title) => {
            modalTitle.textContent = `Links for: "${title}"`;
            modalBody.innerHTML = '<p>Анализ медиа и получение точных размеров...</p>';
            modal.style.display = 'flex';

            refreshPerformanceMap();
            const elementsToProcess = [];

            // This logic is simplified for clarity; you may need to re-add srcset/preload here if necessary
            const filters = { isAll: dataType.startsWith('all-'), isViewport: dataType.startsWith('view-'), isHidden: dataType.startsWith('hidden-'), isImg: dataType.includes('img'), isVid: dataType.includes('vid'), isPregen: dataType.includes('pregen') };
            document.querySelectorAll('img, video').forEach(el => {
                if (el.closest('[data-userscript-ui="true"]')) return;
                if (!filters.isAll) {
                    const inViewport = isElementInViewport(el);
                    if (filters.isViewport && !inViewport) return;
                    if (filters.isHidden && inViewport) return;
                }
                const elIsImg = el.tagName.toLowerCase() === 'img', elIsVid = !elIsImg, elIsPregen = /pre[_-]gen/i.test(el.src);
                let match = (filters.isImg && elIsImg) || (filters.isVid && elIsVid);
                if (match && filters.isPregen && !elIsPregen) match = false;
                if (match && (el.currentSrc || el.src)) {
                    elementsToProcess.push(el);
                }
            });

            const promises = elementsToProcess.map(el => getMediaData(el));
            const mediaDataList = await Promise.all(promises);

            let listHTML = '';
            const processedUrls = new Set();
            for (const data of mediaDataList) {
                if (!data.src || processedUrls.has(data.src)) continue;
                processedUrls.add(data.src);

                const perf = performanceMap.get(data.src);
                const loadTime = perf?.duration ? `${perf.duration.toFixed(0)} ms` : 'N/A';
                const renderedSize = `${data.renderedWidth}x${data.renderedHeight}px`;
                const intrinsicSize = (data.naturalWidth > 0) ? `${data.naturalWidth}x${data.naturalHeight}px` : 'N/A';
                const previewHTML = data.isImg ? `<img class="media-list-preview" src="${data.src}" loading="lazy">` : `<div class="media-list-preview video-preview">📹</div>`;

                listHTML += `<div class="media-list-item">${previewHTML}<div class="media-list-details"><div class="media-list-link"><a href="${data.src}" target="_blank" rel="noopener noreferrer">${data.src}</a></div><div class="media-list-stats"><span><b>Load Time:</b> ${loadTime}</span><span><b>Rendered:</b> ${renderedSize}</span><span><b>Intrinsic:</b> ${intrinsicSize}</span></div></div></div>`;
            }

            modalBody.innerHTML = listHTML || '<p>No links found.</p>';
        };

        const updateMediaCount = () => {
            refreshPerformanceMap();
            const countedUrls = new Set();
            let viewport = { img: 0, vid: 0, p_img: 0, p_vid: 0 }, hidden = { img: 0, vid: 0, p_img: 0, p_vid: 0 };
            document.querySelectorAll('img, video').forEach(el => { if (el.closest('[data-userscript-ui="true"]')) return; if ((el.naturalWidth === 1 && el.naturalHeight === 1)) return; const src = el.dataset.playinlinePreGeneratedSrc || el.currentSrc || el.src || ''; if (!src || src.startsWith('data:') || src.startsWith('blob:')) return; countedUrls.add(src); const isPregen = /pre[_-]gen/i.test(src), isImg = el.tagName.toLowerCase() === 'img'; if (isElementInViewport(el)) { if (isImg) { viewport.img++; if (isPregen) viewport.p_img++; } else { viewport.vid++; if (isPregen) viewport.p_vid++; } } else { if (isImg) { hidden.img++; if (isPregen) hidden.p_img++; } else { hidden.vid++; if (isPregen) hidden.p_vid++; } } });
            let srcset = { img: 0 };
            document.querySelectorAll('img[srcset], source[srcset]').forEach(el => { const srcsetAttr = el.getAttribute('srcset'); if (!srcsetAttr) return; srcsetAttr.split(',').forEach(part => { const url = part.trim().split(' ')[0]; if (url && !countedUrls.has(url)) { srcset.img++; countedUrls.add(url); } }); });
            let preload = { img: 0 };
            document.querySelectorAll('link[rel="preload"][as="image"]').forEach(el => preload.img++);
            const all = { img: viewport.img + hidden.img, p_img: viewport.p_img + hidden.p_img, vid: viewport.vid + hidden.vid, p_vid: viewport.p_vid + hidden.p_vid };
            counterElements['view-img'].textContent = viewport.img; counterElements['view-pregen-img'].textContent = viewport.p_img;
            counterElements['view-vid'].textContent = viewport.vid; counterElements['view-pregen-vid'].textContent = viewport.p_vid;
            counterElements['hidden-img'].textContent = hidden.img; counterElements['hidden-pregen-img'].textContent = hidden.p_img;
            counterElements['hidden-vid'].textContent = hidden.vid; counterElements['hidden-pregen-vid'].textContent = hidden.p_vid;
            counterElements['all-img'].textContent = all.img; counterElements['all-pregen-img'].textContent = all.p_img;
            counterElements['all-vid'].textContent = all.vid; counterElements['all-pregen-vid'].textContent = all.p_vid;
            counterElements['srcset-img'].textContent = srcset.img;
            counterElements['preload-img'].textContent = preload.img;
        };

        const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; };

        /**
         * @eng Makes the panel draggable.
         */
        const makeDraggable = (container) => { const dragHandle = container.querySelector('[data-handle="drag"]'); if (!dragHandle) return; let isDragging = false, offsetX, offsetY; const onDragStart = (e) => { isDragging = true; const coords = e.touches ? e.touches[0] : e; offsetX = coords.clientX - container.getBoundingClientRect().left; offsetY = coords.clientY - container.getBoundingClientRect().top; container.style.transition = 'none'; container.style.right = 'auto'; container.style.bottom = 'auto'; document.addEventListener('mousemove', onDragMove); document.addEventListener('touchmove', onDragMove, { passive: false }); document.addEventListener('mouseup', onDragEnd); document.addEventListener('touchend', onDragEnd); }; const onDragMove = (e) => { if (!isDragging) return; e.preventDefault(); const coords = e.touches ? e.touches[0] : e; container.style.left = `${coords.clientX - offsetX}px`; container.style.top = `${coords.clientY - offsetY}px`; }; const onDragEnd = () => { if (!isDragging) return; isDragging = false; document.removeEventListener('mousemove', onDragMove); document.removeEventListener('touchmove', onDragMove); document.removeEventListener('mouseup', onDragEnd); document.removeEventListener('touchend', onDragEnd); localStorage.setItem(config.storageKeys.position, JSON.stringify({ left: container.offsetLeft, top: container.offsetTop })); }; dragHandle.addEventListener('mousedown', onDragStart); dragHandle.addEventListener('touchstart', onDragStart, { passive: false }); };

        /**
         * @eng Applies the saved panel position from localStorage, or calculates and saves the initial one.
         */
        const initializePanelPosition = (container) => {
            const savedPos = localStorage.getItem(config.storageKeys.position);
            if (savedPos) {
                try {
                    const pos = JSON.parse(savedPos);
                    container.style.left = `${pos.left}px`;
                    container.style.top = `${pos.top}px`;
                } catch (e) { console.error("Failed to apply saved position:", e); }
            } else {
                // If no position is saved, calculate and set the initial position
                // This prevents the panel from disappearing on first-time header clicks
                const rect = container.getBoundingClientRect();
                const initialPos = { left: rect.left, top: rect.top };
                container.style.left = `${initialPos.left}px`;
                container.style.top = `${initialPos.top}px`;
                localStorage.setItem(config.storageKeys.position, JSON.stringify(initialPos));
            }
            container.style.right = 'auto';
            container.style.bottom = 'auto';
        };

        const handleToggleCollapse = (button) => { isPanelCollapsed = !isPanelCollapsed; panelBody.style.display = isPanelCollapsed ? 'none' : 'block'; button.textContent = isPanelCollapsed ? '⊞' : '−'; button.title = isPanelCollapsed ? 'Expand' : 'Collapse'; localStorage.setItem(config.storageKeys.collapsed, JSON.stringify(isPanelCollapsed)); };
        const handleToggleTooltip = (button) => { isTooltipEnabled = !isTooltipEnabled; button.style.opacity = isTooltipEnabled ? '1.0' : '0.4'; button.title = isTooltipEnabled ? 'Disable Tooltip' : 'Enable Tooltip'; localStorage.setItem(config.storageKeys.tooltipEnabled, JSON.stringify(isTooltipEnabled)); };

        /**
         * @eng Handles the "Unblur All" button click by directly removing the blur overlay from photos and videos.
         */
        const handleUnblurAll = (button) => {
            // Find all elements with NSFW text (for both photos and videos)
            const textElements = document.querySelectorAll('[class*="_nsfwText"]');
            let unblurredCount = 0;

            textElements.forEach(textEl => {
                // Combine selectors for both photo and video overlays.
                // This is more specific and robust than the previous generic selector.
                const blurOverlay = textEl.closest('[class*="_photoNoise"], [class*="_noise_"]');
                if (blurOverlay) {
                    blurOverlay.remove();
                    unblurredCount++;
                }
            });

            console.log(`Unblurred ${unblurredCount} items by removing overlays.`);
            if (unblurredCount > 0) {
                button.style.color = '#2ecc71'; // Green feedback
                setTimeout(() => { button.style.color = '#aaa'; }, 1000);
            }
        };

        // --- EVENT LISTENERS AND OBSERVERS ---
        const debouncedUpdateCount = debounce(updateMediaCount, 200);
        const observer = new MutationObserver(debouncedUpdateCount);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
        document.addEventListener('scroll', debouncedUpdateCount, { passive: true });
        window.addEventListener('resize', debouncedUpdateCount, { passive: true }); // FIX: Listen for resize to catch DPR changes

        infoPanel.addEventListener('click', (e) => { const actionTarget = e.target.closest('[data-action]'); if (actionTarget) { const action = actionTarget.dataset.action; if (action === 'close') { infoPanel.remove(); } else if (action === 'toggle-collapse') { handleToggleCollapse(actionTarget); } else if (action === 'toggle-tooltip') { handleToggleTooltip(actionTarget); } else if (action === 'unblur-all') { handleUnblurAll(actionTarget); } } else { const counter = e.target.closest('.counter-link'); if (counter) { populateAndShowModal(counter.dataset.type, counter.dataset.title); } } });
        modal.querySelector('.media-modal-close').addEventListener('click', () => modal.style.display = 'none');
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
        let hideTooltipTimer = null;
        tooltip.addEventListener('mouseover', () => clearTimeout(hideTooltipTimer));
        tooltip.addEventListener('mouseout', () => { hideTooltipTimer = setTimeout(() => { tooltip.style.display = 'none'; }, 300); });

        tooltip.addEventListener('click', (e) => {
            const copyTarget = e.target.closest('.copy-icon');
            if (copyTarget && copyTarget.dataset.copyUrl) {
                navigator.clipboard.writeText(copyTarget.dataset.copyUrl).then(() => {
                    // Prevent re-triggering animation if already running
                    if (copyTarget.classList.contains('copied')) return;

                    copyTarget.classList.add('copied');
                    setTimeout(() => {
                        copyTarget.classList.remove('copied');
                        // Reset animation property to allow it to run again
                        copyTarget.style.animation = 'none';
                        void copyTarget.offsetWidth; // Trigger reflow
                        copyTarget.style.animation = '';
                    }, 600);
                }).catch(err => {
                    console.error('Failed to copy URL: ', err);
                });
            }
        });

        document.addEventListener('mouseover', (e) => { if (!isTooltipEnabled || e.target.closest('[data-userscript-ui="true"]')) return; const container = e.target.closest('[class*="_imageContainer"], [class*="media-container"], [class*="ImageContainer"]'); let imgSrc = '', vidSrc = ''; if (container) { const imageEl = container.querySelector('img'); const videoEl = container.querySelector('video'); if (imageEl) imgSrc = imageEl.currentSrc || imageEl.src; if (videoEl) vidSrc = videoEl.src; } else if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') { const el = e.target; if (el.tagName === 'IMG') imgSrc = el.currentSrc || el.src; if (el.tagName === 'VIDEO') vidSrc = el.currentSrc || el.src; } else if (window.getComputedStyle(e.target).backgroundImage.includes('url')) { imgSrc = window.getComputedStyle(e.target).backgroundImage.match(/url\(['"]?(.*?)['"]?\)/)?.[1] || ''; } if (imgSrc || vidSrc) { let tooltipHTML = ''; if (imgSrc && !imgSrc.startsWith('data:')) { const perf = performanceMap.get(imgSrc); const fileSize = perf?.transferSize ? `${(perf.transferSize / 1024).toFixed(1)} KB` : ''; const fileSizeHTML = fileSize ? `<span class="tooltip-filesize">(${fileSize})</span>` : ''; tooltipHTML += `<div class="tooltip-line"><span class="tooltip-icon copy-icon" data-copy-url="${imgSrc}" title="Copy URL">🖼️</span><div class="tooltip-content"><a href="${imgSrc}" target="_blank" rel="noopener noreferrer">${colorizeUrl(imgSrc)}</a>${fileSizeHTML}</div></div>`; } if (vidSrc && !vidSrc.startsWith('data:')) { const perf = performanceMap.get(vidSrc); const fileSize = perf?.transferSize ? `${(perf.transferSize / 1024).toFixed(1)} KB` : ''; const fileSizeHTML = fileSize ? `<span class="tooltip-filesize">(${fileSize})</span>` : ''; tooltipHTML += `<div class="tooltip-line"><span class="tooltip-icon copy-icon" data-copy-url="${vidSrc}" title="Copy URL">📹</span><div class="tooltip-content"><a href="${vidSrc}" target="_blank" rel="noopener noreferrer">${colorizeUrl(vidSrc)}</a>${fileSizeHTML}</div></div>`; } if (tooltipHTML) { clearTimeout(hideTooltipTimer); tooltip.innerHTML = tooltipHTML; tooltip.style.display = 'block'; tooltip.style.left = `${e.clientX + 15}px`; tooltip.style.top = `${e.clientY + 15}px`; } } }, { passive: true });
        document.addEventListener('mouseout', (e) => { if (!isTooltipEnabled) return; if (e.target.closest('[class*="_imageContainer"], [class*="media-container"], [class*="ImageContainer"]') || e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') { hideTooltipTimer = setTimeout(() => { tooltip.style.display = 'none'; }, 300); } }, { passive: true });

        const tooltipToggleButton = infoPanel.querySelector('[data-action="toggle-tooltip"]');
        tooltipToggleButton.style.opacity = isTooltipEnabled ? '1.0' : '0.4';
        tooltipToggleButton.title = isTooltipEnabled ? 'Disable Tooltip' : 'Enable Tooltip';
        makeDraggable(infoPanel);
        initializePanelPosition(infoPanel);
        debouncedUpdateCount();
    }

    // Wait for the DOM to be ready before initializing the script
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeScript); }
    else { initializeScript(); }

})();
