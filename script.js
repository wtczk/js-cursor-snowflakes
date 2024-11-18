const star = [];
const star_x = [];
const star_y = [];
const star_remaining_ticks = [];
const tiny = [];
const tiny_x = [];
const tiny_y = [];
const tiny_remaining_ticks = [];
const sparkles = 250; // total number of stars, same as number of dots
const sparkle_lifetime = 60; // each star lives for twice this, then turns into a dot that also lives twice this
const sparkle_distance = 30; // pixels

let doc_height;
let doc_width;
let sparkles_enabled = null;

window.onload = () => {
    doc_height = document.documentElement.scrollHeight;
    doc_width = document.documentElement.scrollWidth;
    animateSparkles();
    if (sparkles_enabled === null) sparkle(true);
};

function sparkle(enable = null) {
    sparkles_enabled = enable === null ? !sparkles_enabled : !!enable;
    if (sparkles_enabled && star.length < sparkles) {
        sparkleInit();
    }
}

function sparkleDestroy() {
    while (tiny.length) {
        document.body.removeChild(tiny.pop());
    }
    while (star.length) {
        document.body.removeChild(star.pop());
    }
}

function sparkleInit() {

    function createDiv(height, width) {
        const div = document.createElement('div');
        div.style.cssText = `position: absolute; height: ${height}px; width: ${width}px; overflow: hidden;`;
        return div;
    }

    for (let i = 0; i < sparkles; i++) {
        const tiny_div = createDiv(3, 3);
        tiny_div.style.visibility = 'hidden';
        tiny_div.style.zIndex = '999999999';

        if (tiny[i]) document.body.removeChild(tiny[i])

        document.body.appendChild(tiny_div);
        tiny[i] = tiny_div;
        tiny_remaining_ticks[i] = null;

        const star_div = createDiv(5, 5);
        star_div.style.backgroundColor = 'transparent';
        star_div.style.visibility = 'hidden';
        star_div.style.zIndex = '999999999';

        const bar_horiz = createDiv(1, 5);
        const bar_vert = createDiv(5, 1);
        star_div.appendChild(bar_horiz);
        star_div.appendChild(bar_vert);
        bar_horiz.style.top = '2px';
        bar_horiz.style.left = '0px';
        bar_vert.style.top = '0px';
        bar_vert.style.left = '2px';

        if (star[i]) document.body.removeChild(star[i])

        document.body.appendChild(star_div);
        star[i] = star_div;
        star_remaining_ticks[i] = null;
    }

    window.addEventListener('resize', function () {
        for (let i = 0; i < sparkles; i++) {
            star_remaining_ticks[i] = null;
            star[i].style.left = '0px';
            star[i].style.top = '0px';
            star[i].style.visibility = 'hidden';

            tiny_remaining_ticks[i] = null;
            tiny[i].style.top = '0px';
            tiny[i].style.left = '0px';
            tiny[i].style.visibility = 'hidden';
        }

        doc_height = document.documentElement.scrollHeight;
        doc_width = document.documentElement.scrollWidth;
    });

    document.onmousemove = function (e) {
        if (sparkles_enabled && !e.buttons) {

            const distance = Math.sqrt(Math.pow(e.movementX, 2) + Math.pow(e.movementY, 2));
            const delta_x = e.movementX * sparkle_distance * 2 / distance;
            const delta_y = e.movementY * sparkle_distance * 2 / distance;
            const probability = distance / sparkle_distance;
            let cumulative_x = 0;

            let mouse_y = e.pageY;
            let mouse_x = e.pageX;

            while (Math.abs(cumulative_x) < Math.abs(e.movementX)) {
                createStar(mouse_x, mouse_y, probability);

                let delta = Math.random();
                mouse_x -= delta_x * delta;
                mouse_y -= delta_y * delta;
                cumulative_x += delta_x * delta;
            }
        }
    };
}

function animateSparkles(fps = 60) {
    const interval = 1000 / fps;
    let alive = star.reduce((sum, _, i) => sum + updateStar(i), 0) + tiny.reduce((sum, _, i) => sum + updateTiny(i), 0);

    if (alive === 0 && !sparkles_enabled) sparkleDestroy();
    setTimeout(() => animateSparkles(fps), interval);
}

function createStar(x, y, probability = 1.0) {
    if (x + 5 >= doc_width || y + 5 >= doc_height || Math.random() > probability) return;

    const getWhiteColor = () => 'rgb(255, 255, 255)';
    const minIndex = star_remaining_ticks.findIndex(ticks => !ticks) || star_remaining_ticks.reduce((min, ticks, i) => ticks < star_remaining_ticks[min] ? i : min, 0);

    if (star_remaining_ticks[minIndex]) starToTiny(minIndex);

    star_remaining_ticks[minIndex] = sparkle_lifetime * 2;
    star_x[minIndex] = x;
    star_y[minIndex] = y;
    Object.assign(star[minIndex].style, {
        left: `${x}px`,
        top: `${y}px`,
        clip: 'rect(0px, 5px, 5px, 0px)',
        visibility: 'visible'
    });
    star[minIndex].childNodes[0].style.backgroundColor = star[minIndex].childNodes[1].style.backgroundColor = getWhiteColor();
    return minIndex;
}

function updateStar(i) {
    if (!star_remaining_ticks[i]) return false;

    star_remaining_ticks[i]--;

    if (!star_remaining_ticks[i]) {
        starToTiny(i);
        return false;
    }

    if (star_remaining_ticks[i] === sparkle_lifetime) {
        star[i].style.clip = 'rect(1px, 4px, 4px, 1px)';
    }

    star_y[i] += 1 + 3 * Math.random();
    star_x[i] += (i % 5 - 2) / 5;

    if (star_y[i] + 5 < doc_height && star_x[i] + 5 < doc_width) {
        star[i].style.top = `${star_y[i]}px`;
        star[i].style.left = `${star_x[i]}px`;
        return true;
    }

    star_remaining_ticks[i] = null;
    Object.assign(star[i].style, {
        left: '0px',
        top: '0px',
        visibility: 'hidden'
    });
    return false;
}

function starToTiny(i) {
    if (star_remaining_ticks[i] === null) return;

    if (star_y[i] + 3 < doc_height && star_x[i] + 3 < doc_width) {
        tiny_remaining_ticks[i] = sparkle_lifetime * 2;
        tiny_y[i] = star_y[i];
        tiny[i].style.top = star_y[i] + 'px';
        tiny_x[i] = star_x[i];
        tiny[i].style.left = star_x[i] + 'px';
        tiny[i].style.width = '2px';
        tiny[i].style.height = '2px';
        tiny[i].style.backgroundColor = star[i].childNodes[0].style.backgroundColor;
        star[i].style.visibility = 'hidden';
        tiny[i].style.visibility = 'visible';
    }

    star_remaining_ticks[i] = null;
    star[i].style.left = '0px';
    star[i].style.top = '0px';
    star[i].style.visibility = 'hidden';
}

function updateTiny(i) {
    if (!tiny_remaining_ticks[i]) return false;

    tiny_remaining_ticks[i]--;

    if (tiny_remaining_ticks[i] === sparkle_lifetime) Object.assign(tiny[i].style, { width: '1px', height: '1px' });

    if (tiny_remaining_ticks[i] > 0) {
        tiny_y[i] += 1 + 2 * Math.random();
        tiny_x[i] += (i % 4 - 2) / 4;

        if (tiny_y[i] + 3 < doc_height && tiny_x[i] + 3 < doc_width) {
            Object.assign(tiny[i].style, { top: `${tiny_y[i]}px`, left: `${tiny_x[i]}px` });
            return true;
        }
    }

    tiny_remaining_ticks[i] = null;
    Object.assign(tiny[i].style, { top: '0px', left: '0px', visibility: 'hidden' });
    return false;
}
