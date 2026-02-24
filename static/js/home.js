document.addEventListener("DOMContentLoaded", () => {
    initSPA();
});

function initSPA() {
    const navPills = document.querySelectorAll(".nav-pill");
    const scrollContainer = document.querySelector(".nav-scroll-container");

    if (scrollContainer) {
        const savedScrollPos = sessionStorage.getItem("navScrollPos");
        if (savedScrollPos) {
            scrollContainer.scrollLeft = parseInt(savedScrollPos, 10);
        }
        scrollContainer.addEventListener("scroll", () => {
            sessionStorage.setItem("navScrollPos", scrollContainer.scrollLeft);
        });
    }

    let initialIndex = 0;
    navPills.forEach((pill, idx) => {
        if (pill.classList.contains("active")) initialIndex = idx;
    });

    history.replaceState({ path: window.location.pathname, index: initialIndex }, document.title, window.location.pathname);

    navPills.forEach((pill, index) => {
        pill.addEventListener("click", (e) => handleNavClick(e, pill, index, navPills));
    });

    window.addEventListener("popstate", (e) => {
        handlePopState(e, navPills);
    });
}

function getTargetUrl(text) {
    text = text.trim();
    if (text.includes("About Us")) return "/about-us/";
    if (text.includes("Wishlist")) return "/wishlist/";
    if (text.includes("Cart")) return "/cart/"; // If applicable
    if (text.includes("Your Orders")) return "/orders/"; // If exists
    if (text.includes("Your Address")) return "/address/";
    if (text === "All" || text.includes("All")) return "/";
    return null; // Don't intercept undefined ones
}

async function handleNavClick(e, clickedPill, clickedIndex, navPills) {
    if (document.body.classList.contains("is-transitioning")) {
        e.preventDefault();
        return;
    }

    const text = clickedPill.textContent.trim();
    const targetUrl = getTargetUrl(text);

    if (!targetUrl || window.location.pathname === targetUrl || (targetUrl === "/" && window.location.pathname === "")) {
        return;
    }

    e.preventDefault();

    let currentIndex = history.state?.index ?? 0;
    
    let direction = "rtol"; // Content slides in from right (clicked right pill)
    if (clickedIndex < currentIndex) {
        direction = "ltor"; // Content slides in from left (clicked left pill)
    }

    updateActivePill(navPills, clickedIndex);

    await navigateTo(targetUrl, direction, clickedIndex, false);
}

function updateActivePill(navPills, activeIndex) {
    navPills.forEach((p, idx) => {
        if (idx === activeIndex) {
            p.classList.add("active");
        } else {
            p.classList.remove("active");
        }
    });

    const p = navPills[activeIndex];
    const scrollContainer = document.querySelector(".nav-scroll-container");
    if(p && scrollContainer) {
        p.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

async function navigateTo(url, direction, newIndex, isPopState = false) {
    document.body.classList.add("is-transitioning");

    try {
        const response = await fetch(url);
        if (!response.ok) {
            window.location.href = url;
            return;
        }

        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        
        const newContent = doc.getElementById("page-content");
        if (!newContent) {
            window.location.href = url;
            return;
        }

        if (!isPopState) {
            history.pushState({ path: url, index: newIndex }, doc.title, url);
        }
        document.title = doc.title; 

        syncHeadDocument(doc);

        const oldContent = document.getElementById("page-content");
        
        const transitionContainer = document.createElement('div');
        transitionContainer.className = 'route-transition-container';
        transitionContainer.style.position = 'relative';
        transitionContainer.style.width = '100%';
        transitionContainer.style.overflow = 'hidden';
        transitionContainer.style.display = 'flex'; // ensures things overlap via absolute
        
        transitionContainer.style.minHeight = oldContent.offsetHeight + 'px';

        oldContent.parentNode.insertBefore(transitionContainer, oldContent);
        transitionContainer.appendChild(oldContent);
        transitionContainer.appendChild(newContent);

        oldContent.style.width = '100%';
        oldContent.style.flexShrink = '0';
        
        newContent.style.width = '100%';
        newContent.style.flexShrink = '0';

        let outClass = direction === "ltor" ? "animate-out-right" : "animate-out-left";
        let inClass = direction === "ltor" ? "animate-in-left" : "animate-in-right";

        oldContent.style.position = "absolute";
        oldContent.style.top = "0";
        oldContent.style.left = "0";
        
        oldContent.classList.add(outClass);
        newContent.classList.add(inClass);

        window.scrollTo({ top: 0, behavior: "auto" });

        setTimeout(() => {
            transitionContainer.parentNode.insertBefore(newContent, transitionContainer);
            newContent.classList.remove(inClass);
            newContent.style.width = '';
            newContent.style.flexShrink = '';
            transitionContainer.remove();
            
            document.body.classList.remove("is-transitioning");
            executePageScripts(url);
            
        }, 350); // 350ms duration matching css

    } catch (error) {
        console.error("Navigation error:", error);
        window.location.href = url; // Hard fallback
    }
}

function handlePopState(e, navPills) {
    if (!e.state) return;
    
    const url = e.state.path || window.location.pathname;
    const previousIndex = Array.from(navPills).findIndex(p => p.classList.contains('active'));
    const newIndex = e.state.index ?? previousIndex;
    
    let direction = newIndex < previousIndex ? "ltor" : "rtol";
    
    updateActivePill(navPills, newIndex);
    navigateTo(url, direction, newIndex, true);
}

function syncHeadDocument(newDoc) {
    const currentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                               .map(link => link.getAttribute("href"));
                               
    const newStyles = Array.from(newDoc.querySelectorAll('link[rel="stylesheet"]'));
    
    newStyles.forEach(style => {
        const href = style.getAttribute("href");
        if (href && !currentStyles.includes(href)) {
            const newLink = document.createElement("link");
            newLink.rel = "stylesheet";
            newLink.href = href;
            document.head.appendChild(newLink);
        }
    });

}

function executePageScripts(url) {
    if (url === "/" || url === "/all/" || window.location.pathname === "/") {
        const cards = document.querySelectorAll(".product-card");
        cards.forEach((card, index) => {
            card.style.opacity = "0";
            card.style.transform = "translateY(20px)";
            card.style.transition = "opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease";
            setTimeout(() => {
                card.style.opacity = "1";
                card.style.transform = "translateY(0)";
            }, 100 * (index + 1));
        });
    }
}
