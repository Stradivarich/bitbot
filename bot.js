(function () {
    'use strict';

    const CONFIG = {
        DELAYS: {
            AFTER_LOAD: { min: 10, max: 12 },
            AFTER_ROLL: { min: 8, max: 12 },
            AFTER_CLOSE: { min: 3614, max: 3632 },
            WAIT_FOR_ROLL: 20,
            MAX_ROLL_CHECK_ATTEMPTS: 180,
            WAIT_FOR_TIMER: 5,
            MAX_TIMER_CHECK_ATTEMPTS: 5
        },
        SELECTORS: {
            ROLL_BUTTON: '#free_play_form_button',
            CLOSE_BUTTON: '.close-reveal-modal',
            TIMER: '#time_remaining'
        }
    };

    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function log(message, level = 'info') {
        const time = new Date().toLocaleTimeString();
        const prefix = `[${time}]`;
        if (level === 'error') {
            console.error(`${prefix} ❌ ${message}`);
        } else if (level === 'warn') {
            console.warn(`${prefix} ⚠️ ${message}`);
        } else {
            console.log(`${prefix} ✅ ${message}`);
        }
    }

    function isVisible(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            element.offsetParent !== null &&
            window.getComputedStyle(element).display !== 'none' &&
            window.getComputedStyle(element).visibility !== 'hidden'
        );
    }

    function waitForPageLoad() {
        return new Promise(resolve => {
            const check = () => {
                if (document.readyState === 'complete') {
                    log("Страница полностью загружена.");
                    resolve();
                } else {
                    setTimeout(check, 1000);
                }
            };
            check();
        });
    }

    function waitForVisibleElement(selector, delay = CONFIG.DELAYS.WAIT_FOR_ROLL, maxAttempts = CONFIG.DELAYS.MAX_ROLL_CHECK_ATTEMPTS) {
        return new Promise((resolve, reject) => {
            let attempts = 0;

            const tryFind = () => {
                const element = document.querySelector(selector);

                if (element && isVisible(element)) {
                    log(`Элемент "${selector}" найден и видим!`);
                    return resolve(element);
                }

                attempts++;
                if (attempts >= maxAttempts) {
                    const msg = `Элемент "${selector}" не стал видимым после ${maxAttempts} попыток.`;
                    log(msg, 'error');
                    return reject(new Error(msg));
                }

                if (element) {
                    log(`Элемент "${selector}" существует, но скрыт. Повтор через ${delay} секунд...`, 'warn');
                } else {
                    log(`Элемент "${selector}" не найден. Повтор через ${delay} секунд...`, 'warn');
                }

                setTimeout(tryFind, delay * 1000);
            };

            tryFind();
        });
    }

    function waitRandomTime(min, max) {
        const delay = random(min, max) * 1000;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    async function runAutomation() {
        try {
            log("Скрипт запущен.");
            await waitForPageLoad();

            const waitAfterLoad = random(CONFIG.DELAYS.AFTER_LOAD.min, CONFIG.DELAYS.AFTER_LOAD.max);
            log(`Ожидание ${waitAfterLoad} секунд после загрузки.`);
            await new Promise(r => setTimeout(r, waitAfterLoad * 1000));

            await waitRandomTime(5, 9);
            log("Ожидание случайного времени (5–9 секунд)...");

            log("Поиск первого элемента i.fa.fa-times-circle[aria-hidden='true']...");
            const icon1 = await waitForVisibleElement('i.fa.fa-times-circle[aria-hidden="true"]');
            icon1.click();
            log("Первый элемент закрыт");

            await new Promise(resolve => setTimeout(resolve, 3000));
            log("Ожидание 3 секунды...");

            log("Поиск второго элемента i.fa.fa-times-circle.close_deposit_promo_message...");
            const icon2 = await waitForVisibleElement('i.fa.fa-times-circle.close_deposit_promo_message');
            icon2.click();
            log("Второй элемент закрыт");

            let rollButton;
            try {
                rollButton = await waitForVisibleElement(CONFIG.SELECTORS.ROLL_BUTTON);
            } catch (e) {
                log("Кнопка ROLL не найдена или не видима. Перезапуск через 10 минут.", 'error');
                setTimeout(runAutomation, 10 * 60 * 1000); // 10 минут
                return;
            }

            rollButton.click();
            log("Кнопка ROLL нажата.");

            const waitAfterRoll = random(CONFIG.DELAYS.AFTER_ROLL.min, CONFIG.DELAYS.AFTER_ROLL.max);
            log(`Ожидание ${waitAfterRoll} секунд после нажатия ROLL.`);
            await new Promise(r => setTimeout(r, waitAfterRoll * 1000));

            const closeButton = document.querySelector(CONFIG.SELECTORS.CLOSE_BUTTON);
            if (closeButton) {
                closeButton.click();
                log("Попап закрыт.");
            } else {
                log("Кнопка закрытия попапа не найдена.", 'warn');
            }

            try {
                log("Проверка наличия таймера #time_remaining...");
                await waitForVisibleElement(CONFIG.SELECTORS.TIMER, CONFIG.DELAYS.WAIT_FOR_TIMER, CONFIG.DELAYS.MAX_TIMER_CHECK_ATTEMPTS);
                log("Таймер найден. Продолжаем выполнение.");
            } catch (timerError) {
                log("Таймер не найден. Перезагружаем страницу...", 'error');
                location.reload();
                return;
            }

            const waitBeforeRepeat = random(CONFIG.DELAYS.AFTER_CLOSE.min, CONFIG.DELAYS.AFTER_CLOSE.max);
            log(`Ожидание ${waitBeforeRepeat} секунд перед следующим запуском.`);
            setTimeout(runAutomation, waitBeforeRepeat * 1000);

        } catch (e) {
            log(`Ошибка в работе скрипта: ${e.message}`, 'error');
            setTimeout(runAutomation, 30000);
        }
    }

    runAutomation();
})();