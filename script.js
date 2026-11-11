// ============================================
// ОСНОВНОЙ СКРИПТ С ИНТЕГРАЦИЕЙ ML И АНАЛИЗА ЧЕРЕЗ API
// ============================================

// ===== УПРАВЛЕНИЕ ШАГАМИ АНКЕТЫ =====
let currentStep = 1;
const totalSteps = 5;
let photoAnalysisResult = null;

document.addEventListener('DOMContentLoaded', function() {
    updateProgress();
    setupPhotoUpload();
    updateSummary();
    
    // Проверяем доступность API анализа
    checkApiAvailability();
    
    if (typeof mlEngine !== 'undefined') {
        console.log('🤖 ML Engine initialized');
    }
    
    if (typeof productsDB !== 'undefined' && productsDB.products) {
        console.log('📦 Products DB loaded:', productsDB.products.length + ' products');
    }
});

// ===== ПРОВЕРКА ДОСТУПНОСТИ API =====
async function checkApiAvailability() {
    if (typeof checkSkinApiHealth === 'undefined') {
        console.warn('⚠️ skin-api-client.js не загружен');
        return;
    }
    
    const isAvailable = await checkSkinApiHealth();
    if (isAvailable) {
        console.log('✅ Skin Analysis API доступен на http://localhost:8000');
    } else {
        console.warn('⚠️ Skin Analysis API недоступен. Запустите python app.py в папке skin-analysis-service');
    }
}

// ===== НАВИГАЦИЯ ПО ШАГАМ =====
function nextStep(step) {
    if (!validateStep(currentStep)) {
        return;
    }
    
    showStep(step);
    currentStep = step;
    updateProgress();
    updateSummary();
}

function prevStep(step) {
    showStep(step);
    currentStep = step;
    updateProgress();
}

function showStep(step) {
    document.querySelectorAll('.survey-step').forEach(el => {
        el.classList.remove('active');
    });
    
    const targetStep = document.getElementById(`step-${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }
}

function updateProgress() {
    const progress = (currentStep / totalSteps) * 100;
    const circumference = 314.159;
    const offset = circumference - (progress / 100) * circumference;
    
    const circle = document.getElementById('progress-circle');
    if (circle) {
        circle.style.strokeDashoffset = offset;
    }
    
    const percentText = document.getElementById('progress-percent');
    const stepText = document.getElementById('progress-step');
    
    if (percentText) {
        percentText.textContent = Math.round(progress) + '%';
    }
    
    if (stepText) {
        stepText.textContent = `Шаг ${currentStep}/${totalSteps}`;
    }
    
    updateStepIndicators();
}

function updateStepIndicators() {
    document.querySelectorAll('.step-item').forEach(item => {
        const step = parseInt(item.dataset.step);
        item.classList.remove('active', 'completed');
        
        if (step === currentStep) {
            item.classList.add('active');
        } else if (step < currentStep) {
            item.classList.add('completed');
        }
    });
}

// ===== ВАЛИДАЦИЯ ШАГОВ =====
function validateStep(step) {
    switch(step) {
        case 1: return validateStep1();
        case 2: return validateStep2();
        case 3: return validateStep3();
        case 4: return validateStep4();
        case 5: return validateStep5();
        default: return true;
    }
}

function validateStep1() {
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const location = document.getElementById('location').value;
    
    if (!age || age < 12 || age > 99) {
        alert('Пожалуйста, укажите корректный возраст (от 12 до 99 лет)');
        return false;
    }
    if (!gender) {
        alert('Пожалуйста, выберите ваш пол');
        return false;
    }
    if (!location) {
        alert('Пожалуйста, выберите ваш регион проживания');
        return false;
    }
    return true;
}

function validateStep2() {
    const concerns = document.querySelectorAll('input[name="skin-concerns"]:checked');
    if (concerns.length === 0) {
        alert('Пожалуйста, выберите хотя бы одну проблему кожи');
        return false;
    }
    return true;
}

function validateStep3() {
    const budget = document.getElementById('budget').value;
    if (!budget) {
        alert('Пожалуйста, выберите ваш бюджет');
        return false;
    }
    return true;
}

function validateStep4() {
    // Шаг с фото не обязательный
    return true;
}

function validateStep5() {
    const agreement = document.getElementById('privacy-agreement');
    if (!agreement.checked) {
        alert('Пожалуйста, согласитесь с обработкой персональных данных');
        return false;
    }
    return true;
}

// ===== ОБНОВЛЕНИЕ СВОДКИ =====
function updateSummary() {
    const summary = document.getElementById('survey-summary');
    if (!summary) return;
    
    const age = document.getElementById('age').value || 'Не указано';
    const gender = document.getElementById('gender').value || 'Не указано';
    const location = document.getElementById('location').value || 'Не указано';
    const concerns = Array.from(document.querySelectorAll('input[name="skin-concerns"]:checked'))
        .map(el => el.value).join(', ') || 'Не выбрано';
    const budget = document.getElementById('budget').value || 'Не указано';
    
    summary.innerHTML = `
        <div class="summary-item">
            <span class="summary-label">Возраст</span>
            <span class="summary-value">${age}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Пол</span>
            <span class="summary-value">${getGenderLabel(gender)}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Регион</span>
            <span class="summary-value">${getLocationLabel(location)}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Проблемы кожи</span>
            <span class="summary-value">${concerns}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Бюджет</span>
            <span class="summary-value">${getBudgetLabel(budget)}</span>
        </div>
    `;
}

// ===== ХЕЛПЕРЫ =====
function getGenderLabel(value) {
    const labels = {
        'female': 'Женский',
        'male': 'Мужской',
        'other': 'Другой',
        'prefer-not-to-say': 'Предпочитаю не указывать'
    };
    return labels[value] || value;
}

function getLocationLabel(value) {
    const labels = {
        'urban': 'Город',
        'suburban': 'Пригород',
        'rural': 'Сельская местность'
    };
    return labels[value] || value;
}

function getBudgetLabel(value) {
    const labels = {
        'low': 'Экономный (до 2000 руб.)',
        'medium': 'Средний (2000-5000 руб.)',
        'high': 'Премиум (5000+ руб.)',
        'flexible': 'Готов(а) инвестировать'
    };
    return labels[value] || value;
}

function getSkinTypeLabel(type) {
    const labels = {
        'normal': 'Нормальная',
        'dry': 'Сухая',
        'oily': 'Жирная',
        'combination': 'Комбинированная',
        'mature': 'Зрелая',
        'sensitive': 'Чувствительная'
    };
    return labels[type] || type;
}

function getProblemLabel(problem) {
    const labels = {
        'acne': 'Акне',
        'redness': 'Покраснения',
        'bags': 'Мешки под глазами',
        'texture': 'Неровная текстура'
    };
    return labels[problem] || problem;
}

function getLevelLabel(level) {
    const labels = {
        'low': 'Низкий',
        'medium': 'Средний',
        'high': 'Высокий'
    };
    return labels[level] || level;
}

// ===== НАСТРОЙКА ЗАГРУЗКИ ФОТОГРАФИЙ =====
function setupPhotoUpload() {
    const frontInput = document.getElementById('front-photo');
    if (frontInput) {
        frontInput.addEventListener('change', async function(e) {
            await handlePhotoUpload(this.files[0], 'front');
        });
    }
    
    const sideInput = document.getElementById('side-photo');
    if (sideInput) {
        sideInput.addEventListener('change', async function(e) {
            await handlePhotoUpload(this.files[0], 'side');
        });
    }
}

async function handlePhotoUpload(file, type) {
    if (!file) return;
    
    const preview = document.getElementById(type + '-preview');
    const analysisResult = document.getElementById(type + '-analysis');
    
    // Показываем превью
    const reader = new FileReader();
    reader.onload = function(event) {
        preview.innerHTML = `<img src="${event.target.result}" alt="Фото ${type}">`;
    };
    reader.readAsDataURL(file);
    
    // Показываем статус
    if (analysisResult) {
        analysisResult.innerHTML = '<div class="analyzing">🔬 Анализ фото...</div>';
    }
    
    // Вызываем API
    if (typeof analyzeSkinPhoto === 'undefined') {
        if (analysisResult) {
            analysisResult.innerHTML = '<div class="analysis-error">⚠️ skin-api-client.js не загружен</div>';
        }
        return;
    }
    
    try {
        const apiResult = await analyzeSkinPhoto(file);
        
        if (apiResult) {
            // ==========================================
            // НОВАЯ ПРОВЕРКА: Если лицо не найдено
            // ==========================================
            if (apiResult.face_detected === false) {
                if (analysisResult) {
                    analysisResult.innerHTML = `
                        <div class="analysis-error" style="background: #fff3cd; color: #856404; padding: 12px; border-radius: 8px; border-left: 4px solid #ffeeba; margin-top: 10px; font-size: 13px; text-align: left;">
                            ⚠️ <strong>Лицо не обнаружено.</strong><br>
                            Пожалуйста, загрузите четкое селфи анфас при хорошем освещении.
                        </div>
                    `;
                }
                // Очищаем превью и поле ввода, чтобы пользователь загрузил другое фото
                preview.innerHTML = ''; 
                document.getElementById(type + '-photo').value = ''; 
                photoAnalysisResult = null;
                return; // Прерываем выполнение
            }
            // ==========================================

            const result = mapApiResultToAnalysis(apiResult);
            
            // Для front-фото сохраняем результат для дальнейшего использования
            if (type === 'front') {
                photoAnalysisResult = result;
            }
            
            if (analysisResult) {
                displayAnalysisResult(analysisResult, result);
            }
            
            if (type === 'front') {
                updatePhotoSummary();
            }
        } else {
            if (analysisResult) {
                analysisResult.innerHTML = '<div class="analysis-error">⚠️ Сервис анализа недоступен. Убедитесь, что Python-сервер запущен на порту 8000.</div>';
            }
        }
    } catch (error) {
        if (analysisResult) {
            analysisResult.innerHTML = '<div class="analysis-error">❌ Ошибка анализа</div>';
        }
        console.error('Analysis error:', error);
    }
}

// ===== МАППИНГ РЕЗУЛЬТАТА API =====
function mapApiResultToAnalysis(apiResult) {
    const skinTypeMap = {
        'dry': 'dry',
        'oily': 'oily',
        'normal': 'normal',
        'combination': 'combination',
    };
    
    const levelMap = {
        'none': 'low',
        'low': 'low',
        'medium': 'medium',
        'high': 'high',
    };
    
    const analysis = {
        skinType: skinTypeMap[apiResult.skin_type.label] || 'normal',
        problems: [],
        acneLevel: levelMap[apiResult.acne.label] || 'low',
        rednessLevel: scoreToLevel(apiResult.metrics.redness),
        bagsLevel: scoreToLevel(apiResult.metrics.dark_circles),
        confidence: apiResult.skin_type.confidence,
        rawMetrics: apiResult.metrics,
    };
    
    // Определяем проблемы
    if (apiResult.acne.label === 'medium' || apiResult.acne.label === 'high') {
        analysis.problems.push('acne');
    }
    if (apiResult.metrics.redness > 50) {
        analysis.problems.push('redness');
    }
    if (apiResult.metrics.dark_circles > 40) {
        analysis.problems.push('bags');
    }
    if (apiResult.metrics.texture > 50) {
        analysis.problems.push('texture');
    }
    
    return { analysis };
}

function scoreToLevel(score) {
    if (score < 30) return 'low';
    if (score < 60) return 'medium';
    return 'high';
}

// ===== ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ АНАЛИЗА =====
function displayAnalysisResult(container, result) {
    const analysis = result.analysis;
    
    let problemsText = analysis.problems.length > 0 
        ? analysis.problems.map(p => getProblemLabel(p)).join(', ')
        : 'Не обнаружено';
    
    container.innerHTML = `
        <div class="analysis-success">
            <div class="analysis-detail">
                <span class="analysis-label">Тип кожи:</span>
                <span class="analysis-value">${getSkinTypeLabel(analysis.skinType)}</span>
            </div>
            <div class="analysis-detail">
                <span class="analysis-label">Проблемы:</span>
                <span class="analysis-value">${problemsText}</span>
            </div>
            <div class="analysis-levels">
                <div class="level-item">
                    <span>Акне:</span>
                    <span class="level-badge ${analysis.acneLevel}">${getLevelLabel(analysis.acneLevel)}</span>
                </div>
                <div class="level-item">
                    <span>Покраснения:</span>
                    <span class="level-badge ${analysis.rednessLevel}">${getLevelLabel(analysis.rednessLevel)}</span>
                </div>
                <div class="level-item">
                    <span>Мешки:</span>
                    <span class="level-badge ${analysis.bagsLevel}">${getLevelLabel(analysis.bagsLevel)}</span>
                </div>
            </div>
            <div class="analysis-confidence">
                Уверенность: ${Math.round(analysis.confidence)}%
            </div>
        </div>
    `;
}

// ===== ОБНОВЛЕНИЕ СВОДКИ ПО ФОТО =====
function updatePhotoSummary() {
    const summary = document.getElementById('photo-summary');
    if (!summary) return;
    
    if (photoAnalysisResult) {
        summary.style.display = 'block';
        const analysis = photoAnalysisResult.analysis;
        
        const skinTypeEl = document.getElementById('analysis-skin-type');
        const problemsEl = document.getElementById('analysis-problems');
        const acneEl = document.getElementById('analysis-acne');
        const rednessEl = document.getElementById('analysis-redness');
        const bagsEl = document.getElementById('analysis-bags');
        
        if (skinTypeEl) skinTypeEl.textContent = getSkinTypeLabel(analysis.skinType);
        if (problemsEl) {
            problemsEl.textContent = analysis.problems.length > 0 
                ? analysis.problems.map(p => getProblemLabel(p)).join(', ')
                : 'Не обнаружено';
        }
        if (acneEl) acneEl.textContent = getLevelLabel(analysis.acneLevel);
        if (rednessEl) rednessEl.textContent = getLevelLabel(analysis.rednessLevel);
        if (bagsEl) bagsEl.textContent = getLevelLabel(analysis.bagsLevel);
    }
}

// ===== СБОР ДАННЫХ =====
function collectUserData() {
    const data = {
        age: parseInt(document.getElementById('age').value) || 0,
        gender: document.getElementById('gender').value || '',
        location: document.getElementById('location').value || '',
        lifestyle: Array.from(document.querySelectorAll('input[name="lifestyle"]:checked')).map(el => el.value),
        skinConcerns: Array.from(document.querySelectorAll('input[name="skin-concerns"]:checked')).map(el => el.value),
        currentRoutine: document.getElementById('current-routine').value || '',
        budget: document.getElementById('budget').value || '',
        preferences: Array.from(document.querySelectorAll('input[name="preferences"]:checked')).map(el => el.value),
        allergies: document.getElementById('allergies').value || '',
        hasFrontPhoto: document.getElementById('front-photo').files.length > 0,
        hasSidePhoto: document.getElementById('side-photo').files.length > 0,
        photoAnalysis: photoAnalysisResult
    };
    return data;
}

// ===== ГЛАВНАЯ ОБРАБОТКА ОТПРАВКИ ФОРМЫ =====
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('skin-survey');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateStep(5)) {
                return;
            }

            // === НОВАЯ ПРОВЕРКА ===
            // Проверяем, прикреплял ли пользователь фото, 
            // и если да — удалось ли нам найти на нем лицо.
            const hasFrontPhoto = document.getElementById('front-photo').files.length > 0;
            if (hasFrontPhoto && !photoAnalysisResult) {
                alert('Пожалуйста, загрузите корректное фото с вашим лицом. Или удалите файл из шага 4, чтобы мы подобрали уход только на основе анкеты.');
                return; // Останавливаем отправку формы
            }
            // ======================

            const userData = collectUserData();
            
            let recommendations;
            
            if (typeof mlEngine !== 'undefined' && mlEngine.isTrained) {
                console.log('🤖 Using ML Engine for predictions');
                recommendations = processWithML(userData);
            } else {
                console.log('📝 Using fallback rule-based system');
                recommendations = generateRecommendations(userData);
                recommendations.mlMetrics = {
                    skinType: recommendations.skinType,
                    confidence: 70,
                    accuracy: 75,
                    method: 'rule-based'
                };
            }
            
            showResults(recommendations, userData);
        });
    }
});

// ===== ОБРАБОТКА С ML =====
function processWithML(userData) {
    try {
        const features = mlEngine.extractFeatures({
            age: userData.age,
            concerns: userData.skinConcerns,
            lifestyle: userData.lifestyle
        });
        
        const prediction = mlEngine.predictKNN(features, 5);
        
        console.log('🔮 ML Prediction:', {
            skinType: prediction.skinType,
            confidence: prediction.confidence + '%'
        });
        
        const recommendations = mlEngine.recommendProducts(
            prediction.skinType,
            userData
        );
        
        recommendations.mlMetrics = {
            skinType: prediction.skinType,
            confidence: prediction.confidence,
            accuracy: mlEngine.accuracy,
            method: 'ml-knn'
        };
        
        if (userData.photoAnalysis) {
            recommendations.photoAnalysis = userData.photoAnalysis.analysis;
            recommendations.photoRecommendations = userData.photoAnalysis.recommendations;
        }
        
        return recommendations;
    } catch (error) {
        console.error('ML processing error:', error);
        return generateRecommendations(userData);
    }
}

// ===== ГЕНЕРАЦИЯ РЕКОМЕНДАЦИЙ (FALLBACK) =====
function generateRecommendations(data) {
    const recommendations = {
        skinType: determineSkinType(data),
        concerns: data.skinConcerns,
        products: [],
        routine: [],
        tips: [],
        explanation: '',
        photoAnalysis: data.photoAnalysis ? data.photoAnalysis.analysis : null,
        photoRecommendations: data.photoAnalysis ? data.photoAnalysis.recommendations : null
    };
    
    const concerns = data.skinConcerns;
    const age = data.age;
    const budget = data.budget;
    const preferences = data.preferences;
    
    // Акне
    if (concerns.includes('acne') || concerns.includes('blackheads')) {
        recommendations.products.push({
            name: 'Очищающий гель с салициловой кислотой',
            category: 'Очищение',
            price: budget === 'low' ? '500-800 руб.' : budget === 'medium' ? '800-1500 руб.' : '1500-3000 руб.',
            description: 'Эффективно очищает поры и борется с акне',
            effectiveness: 85
        });
        recommendations.routine.push('Умывание гелем с салициловой кислотой 2 раза в день');
    }
    
    // Сухость
    if (concerns.includes('dryness') || concerns.includes('sensitivity')) {
        recommendations.products.push({
            name: 'Увлажняющий крем с керамидами',
            category: 'Увлажнение',
            price: budget === 'low' ? '600-1000 руб.' : budget === 'medium' ? '1000-2000 руб.' : '2000-3500 руб.',
            description: 'Восстанавливает защитный барьер',
            effectiveness: 90
        });
        recommendations.routine.push('Использовать увлажняющий крем утром и вечером');
        recommendations.tips.push('Избегайте агрессивных очищающих средств');
    }
    
    // Пигментация
    if (concerns.includes('pigmentation') || concerns.includes('redness')) {
        recommendations.products.push({
            name: 'Сыворотка с витамином С',
            category: 'Сыворотка',
            price: budget === 'low' ? '1000-1500 руб.' : budget === 'medium' ? '1500-3000 руб.' : '3000-6000 руб.',
            description: 'Осветляет пигментные пятна',
            effectiveness: 87
        });
        recommendations.routine.push('Наносить сыворотку с витамином С утром');
        recommendations.routine.push('Обязательно использовать SPF каждый день');
    }
    
    // Антивозрастной
    if (concerns.includes('wrinkles') || age > 30) {
        recommendations.products.push({
            name: 'Антивозрастной крем с ретинолом',
            category: 'Антивозрастной',
            price: budget === 'low' ? '1000-1500 руб.' : budget === 'medium' ? '1500-3000 руб.' : '3000-6000 руб.',
            description: 'Разглаживает морщины',
            effectiveness: 88
        });
        recommendations.routine.push('Ввести ретинол в вечерний уход (2 раза в неделю)');
        recommendations.tips.push('Всегда используйте SPF при использовании ретинола');
    }
    
    // Добавляем SPF для всех
    recommendations.products.push({
        name: 'Солнцезащитный крем SPF 50+',
        category: 'Защита',
        price: budget === 'low' ? '400-700 руб.' : budget === 'medium' ? '700-1500 руб.' : '1500-3000 руб.',
        description: 'Обязательная ежедневная защита',
        effectiveness: 85
    });
    
    recommendations.routine.push('Очищение → Сыворотка → Увлажнение → SPF (утром)');
    recommendations.routine.push('Очищение → Сыворотка → Увлажнение (вечером)');
    
    // Советы по возрасту
    if (age < 20) recommendations.tips.push('Базовый уход: очищение + увлажнение');
    else if (age < 30) recommendations.tips.push('Введите антиоксиданты в уход');
    else if (age < 40) recommendations.tips.push('Начинайте использовать ретинол и пептиды');
    else recommendations.tips.push('Фокус на интенсивное увлажнение и лифтинг');
    
    // Советы по бюджету
    if (budget === 'low') {
        recommendations.tips.push('Обратите внимание на корейские бренды');
        recommendations.tips.push('Аптечные аналоги - хорошая альтернатива');
    }
    
    // Советы по предпочтениям
    if (preferences.includes('natural') || preferences.includes('vegan')) {
        recommendations.tips.push('Ищите сертификаты натуральности');
    }
    if (preferences.includes('cruelty-free')) {
        recommendations.tips.push('Ищите маркировку Cruelty-Free');
    }
    
    // Добавляем рекомендации из фотоанализа
    if (recommendations.photoAnalysis && recommendations.photoAnalysis.problems.length > 0) {
        recommendations.tips.push('📸 Результаты фотоанализа учтены в рекомендациях');
        if (recommendations.photoRecommendations && recommendations.photoRecommendations.tips) {
            recommendations.tips.push(...recommendations.photoRecommendations.tips);
        }
    }
    
    const skinType = determineSkinType(data);
    recommendations.skinType = skinType;
    recommendations.explanation = `Ваш тип кожи — ${getSkinTypeLabel(skinType).toLowerCase()}. `;
    recommendations.explanation += `Учтены проблемы: ${concerns.join(', ') || 'не указаны'}.`;
    
    return recommendations;
}

// ===== ОПРЕДЕЛЕНИЕ ТИПА КОЖИ =====
function determineSkinType(data) {
    const { skinConcerns: concerns, age } = data;
    let dry = concerns.includes('dryness') || concerns.includes('sensitivity');
    let oily = concerns.includes('oiliness') || concerns.includes('acne') || concerns.includes('blackheads');
    
    if (data.photoAnalysis && data.photoAnalysis.analysis) {
        const photoType = data.photoAnalysis.analysis.skinType;
        if (photoType === 'dry') dry = true;
        if (photoType === 'oily') oily = true;
        if (photoType === 'combination') { dry = true; oily = true; }
    }
    
    if (dry && !oily) return 'dry';
    if (oily && !dry) return 'oily';
    if (dry && oily) return 'combination';
    if (concerns.includes('wrinkles') && age > 35) return 'mature';
    return 'normal';
}

// ===== ПОКАЗ РЕЗУЛЬТАТОВ =====
function showResults(recommendations, userData) {
    // 1. Скрываем всю сетку с формой и сайдбаром
    const wrapper = document.getElementById('survey-wrapper');
    if (wrapper) {
        wrapper.style.display = 'none';
    }

    // 2. Показываем секцию анализа
    const analysisSection = document.getElementById('analysis-section');
    if (analysisSection) {
        analysisSection.style.display = 'block';
    }

    // 3. Запускаем анимацию прогресса
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            finishAnalysis(recommendations, userData);
        }
        
        const circle = document.getElementById('analysis-progress-circle');
        const percent = document.getElementById('analysis-percent');
        
        if (circle) {
            const offset = 314.159 - (progress / 100) * 314.159;
            circle.style.strokeDashoffset = offset;
        }
        if (percent) {
            percent.textContent = Math.round(progress) + '%';
        }
    }, 300);
}

// Новая функция для отображения результатов на той же странице
function finishAnalysis(recommendations, userData) {
    document.getElementById('analysis-section').style.display = 'none';
    const recSection = document.getElementById('recommendations-section');
    if (recSection) {
        recSection.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Заполняем данные
    document.getElementById('rec-explanation').textContent = recommendations.explanation || 'Ваш персональный уход готов.';
    
    const metrics = recommendations.mlMetrics || { skinType: recommendations.skinType, confidence: 70 };
    document.getElementById('rec-skin-type').textContent = getSkinTypeLabel(metrics.skinType);
    document.getElementById('rec-confidence').textContent = metrics.confidence + '%';

    // Рутина
    const routineList = document.getElementById('rec-routine');
    routineList.innerHTML = recommendations.routine.map(step => `
        <li>${step}</li>
    `).join('');

    // Продукты (используем классы из нового CSS)
    const productsGrid = document.getElementById('rec-products');
    productsGrid.innerHTML = recommendations.products.map(p => `
        <div class="rec-product-card">
            <h4>${p.name}</h4>
            <span class="category">${p.category || 'Уход'}</span>
            <p class="description">${p.description || 'Идеально подходит для вашего типа кожи'}</p>
            <div class="rec-product-meta">
                <span class="price">💰 ${p.price ? p.price + ' ₽' : 'Цена уточняется'}</span>
                <span class="effectiveness">⭐ ${p.effectiveness || 85}%</span>
            </div>
        </div>
    `).join('');

    // Прокрутка наверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getSkinDescription(type) {
    const descriptions = {
        dry: 'Кожа склонна к сухости, требует интенсивного увлажнения.',
        oily: 'Кожа с повышенной активностью сальных желез.',
        combination: 'Комбинированная кожа с разными зонами.',
        normal: 'Здоровая, сбалансированная кожа.',
        mature: 'Кожа с признаками старения.'
    };
    return descriptions[type] || 'Уникальный тип кожи.';
}

// ===== МОБИЛЬНОЕ МЕНЮ =====
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.querySelector('.nav');
    
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', function() {
            nav.classList.toggle('open');
        });
    }
});
// ===== ЛОГИКА ДЛЯ ШАГА 2: "Ничего из перечисленного" =====
document.addEventListener('DOMContentLoaded', () => {
    const noneCheckbox = document.getElementById('concern-none');
    const allConcernCheckboxes = document.querySelectorAll('input[name="skin-concerns"]');

    if (noneCheckbox) {
        noneCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Если выбрали "Ничего", снимаем галочки со всех остальных
                allConcernCheckboxes.forEach(cb => {
                    if (cb !== noneCheckbox) {
                        cb.checked = false;
                        // Убираем визуальный стиль "выбрано" у родителя (label)
                        cb.closest('.checkbox').classList.remove('checked');
                    }
                });
            }
        });

        // Если пользователь кликнул на другие проблемы, снимаем галочку с "Ничего"
        allConcernCheckboxes.forEach(cb => {
            if (cb !== noneCheckbox) {
                cb.addEventListener('change', function() {
                    if (this.checked) {
                        noneCheckbox.checked = false;
                        noneCheckbox.closest('.checkbox').classList.remove('checked');
                    }
                });
            }
        });
    }
});
// ===== ЛОГИКА ДЛЯ ШАГА 3: Аллергии (Да/Нет) =====
document.addEventListener('DOMContentLoaded', () => {
    const allergyYes = document.getElementById('allergy-yes');
    const allergyNo = document.getElementById('allergy-no');
    const allergyWrapper = document.getElementById('allergy-input-wrapper');
    const allergyInput = document.getElementById('allergies');

    if (allergyYes && allergyNo) {
        // 1. Логика переключения (взаимоисключение)
        allergyYes.addEventListener('change', function() {
            if (this.checked) {
                allergyNo.checked = false; // Снимаем галочку с "Нет"
                if (allergyWrapper) allergyWrapper.style.display = 'block';
                if (allergyInput) {
                    allergyInput.disabled = false;
                    allergyInput.focus();
                }
            } else {
                // Если сняли галочку с "Да", возвращаем "Нет" по умолчанию
                allergyNo.checked = true;
                if (allergyWrapper) allergyWrapper.style.display = 'none';
                if (allergyInput) {
                    allergyInput.value = '';
                    allergyInput.disabled = true;
                }
            }
        });

        allergyNo.addEventListener('change', function() {
            if (this.checked) {
                allergyYes.checked = false; // Снимаем галочку с "Да"
                if (allergyWrapper) allergyWrapper.style.display = 'none';
                if (allergyInput) {
                    allergyInput.value = '';
                    allergyInput.disabled = true;
                }
            } else {
                // Если сняли галочку с "Нет", возвращаем "Да"
                allergyYes.checked = true;
                if (allergyWrapper) allergyWrapper.style.display = 'block';
                if (allergyInput) allergyInput.disabled = false;
            }
        });
    }
});