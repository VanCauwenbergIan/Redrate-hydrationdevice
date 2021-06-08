const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);

let htmlTemperatuur, htmlVochtigheid, htmlDailyProgress, htmlWaterDrunk, htmlBottlesWhole, htmlBottlesFraction, htmlSwitchProgress, htmlSwitchInfo;

// callback-visualisation -show

const showTemp = function(jsonObject){
    console.log(jsonObject);
    updateTemperatuur(jsonObject.temperatuur.gemetenwaarde);
}

const showHum = function(jsonObject){
    console.log(jsonObject);
    updateVochtigheid(jsonObject.vochtigheid.gemetenwaarde);
}

const showDailyProgress = function(jsonObject){
    if (jsonObject.progress.length > 0){
        console.log(jsonObject);
        let progress = 0;
        let baseline = 0;
        // console.log(baseline);
        for (let i = 0; i < jsonObject.progress.length; i++){
            let gewicht = jsonObject.progress[i].gemetenwaarde
            if (i == 0){
                baseline = jsonObject.progress[0].gemetenwaarde
                console.log(`Nieuwe fles: inhoud ${baseline/1000} l`)
            }
            if (i >= 1){
                let vorig_gewicht = jsonObject.progress[i - 1].gemetenwaarde
                if (gewicht < vorig_gewicht){
                    let verschil = (vorig_gewicht - gewicht)/1000;
                    progress += verschil;
                }
                else{
                    baseline = gewicht
                    
                }
            }
        }

        let progress_in_procent = (progress / 1.5 * 100).toFixed(2);
        // let bottles_whole = Math.round((1.5/(baseline/1000)) - Math.round(1000 / baseline))

        if (htmlDailyProgress){
            htmlDailyProgress.innerHTML = progress_in_procent
            htmlWaterDrunk.innerHTML = progress.toFixed(3) + ' l'
            htmlBottlesWhole.innerHTML = Math.round((1.5/(baseline/1000)) - progress)
            updateWaves(progress_in_procent*0.75)

            if (progress > 2){
               document.querySelector('.js-2liter-message').classList.remove('u-display-none-o')
            }
            else {
                document.querySelector('.js-2liter-message').classList.add('u-display-none-o')
            }
        }
        else {
            let liter = ((progress_in_procent / 100) * 1.5).toFixed(4);
            innerhtml = `${liter}l / min 1,5l`;
            document.querySelector('.js-waterdrunk').innerHTML = innerhtml;
        }
    }
    else {
        htmlDailyProgress.innerHTML = 0
        htmlWaterDrunk.innerHTML = 0 + ' l'
        htmlBottlesWhole.innerHTML = 3
    
        updateWaves(0);
        }
}
// data access -get

const getTemp = function(){
    handleData(`http://192.168.168.168:5000/api/v1/today/temp`, showTemp);
}

const getHum = function(){
    handleData(`http://192.168.168.168:5000/api/v1/today/hum`, showHum); 
}

const getDailyProgress = function(){
    handleData(`http://192.168.168.168:5000/api/v1/today/prog`, showDailyProgress);
}

// socket listeners

const listenToSocket = function(){
    socket.on("B2F_addlog", function (jsonObject){
        console.log(`boodschap server: aangepaste waarde of status`);
        if (htmlTemperatuur) {
            if (jsonObject.deviceid == 4){
                console.log(`Nieuwe temperatuur: ${jsonObject.gemetenwaarde}°C`);
                updateTemperatuur(jsonObject.gemetenwaarde);
            }
            else if (jsonObject.deviceid == 3){
                console.log(`Nieuwe relatieve luchtvochtigheid: ${jsonObject.gemetenwaarde}%`);
                updateVochtigheid(jsonObject.gemetenwaarde);
            }
        }
        if (jsonObject.deviceid == 2){
            console.log(`Nieuwe relatieve luchtvochtigheid: ${jsonObject.gemetenwaarde}%`);
            getDailyProgress();
        }
    })
}

const DisplaySettings = function(){
    const button = document.querySelector('.js-settings-button');
    button.addEventListener("click", function(){
        htmlSettings.classList.remove("u-display-none");
    })
    RemoveSettings();
    listenToClickConfirm();
}

const RemoveSettings = function(){
    const button = document.querySelector('.js-cancel')
    button.addEventListener("click", function(){
        htmlSettings.classList.add("u-display-none")
    })
}

const listenToClickConfirm = function(){
    const button = document.querySelector('.js-confirm');
    button.addEventListener("click", function(){
        let status = document.querySelector('.js-mode').checked
        if (status == true){
          status = 1;
        }
        else{
          status = 0;
        }

        console.log("Nieuwe settings")
        const jsonObject = {
            Periode: document.querySelector('.js-period').value,
            Modus: status
        }
        htmlSettings.classList.add("u-display-none")
        console.log(jsonObject)
    })
}

// functies voor socket listeners

const updateTemperatuur = function(temperatuur){
    htmlTemperatuur.innerHTML = `${temperatuur}°C`;
}

const updateVochtigheid = function(vochtigheid){
    htmlVochtigheid.innerHTML = `${vochtigheid}%`
}

const updateWaves = function(procent){
   if (procent < 100){
        htmlWaves.style.transform = `translateY(${100 - procent}%)`;
        updateMeasurements(procent);
   }
   else{
        htmlWaves.style.transform = `translateY(${100 - procent}%)`;
        updateMeasurements(100);
   }
}

const updateMeasurements = function(procent){
    let innerhtml = ''
    if (procent < 12.5){
        innerhtml = `
        <li class="c-measure" style="opacity: 0;" >2000ml</li>
        <li class="c-measure u-switch">1750ml</li>
        <li class="c-measure u-switch">1500ml</li>
        <li class="c-measure u-switch">1250ml</li>
        <li class="c-measure u-switch">1000ml</li>
        <li class="c-measure u-switch">750ml</li>
        <li class="c-measure u-switch">500ml</li>
        <li class="c-measure u-switch">250ml</li>
        <li class="c-measure" style="opacity: 0;">0ml</li>`
    }
    else if (procent < 25){
        innerhtml = `
        <li class="c-measure" style="opacity: 0;" >2000ml</li>
        <li class="c-measure u-switch">1750ml</li>
        <li class="c-measure u-switch">1500ml</li>
        <li class="c-measure u-switch">1250ml</li>
        <li class="c-measure u-switch">1000ml</li>
        <li class="c-measure u-switch">750ml</li>
        <li class="c-measure u-switch">500ml</li>
        <li class="c-measure">250ml</li>
        <li class="c-measure" style="opacity: 0;">0ml</li>`
    }
    else if (procent < 37.5){
        innerhtml = `
        <li class="c-measure" style="opacity: 0;" >2000ml</li>
        <li class="c-measure u-switch">1750ml</li>
        <li class="c-measure u-switch">1500ml</li>
        <li class="c-measure u-switch">1250ml</li>
        <li class="c-measure u-switch">1000ml</li>
        <li class="c-measure u-switch">750ml</li>
        <li class="c-measure">500ml</li>
        <li class="c-measure">250ml</li>
        <li class="c-measure" style="opacity: 0;">0ml</li>`
    }
    else if (procent < 50){
        innerhtml = `
        <li class="c-measure" style="opacity: 0;" >2000ml</li>
        <li class="c-measure u-switch">1750ml</li>
        <li class="c-measure u-switch">1500ml</li>
        <li class="c-measure u-switch">1250ml</li>
        <li class="c-measure u-switch">1000ml</li>
        <li class="c-measure">750ml</li>
        <li class="c-measure">500ml</li>
        <li class="c-measure">250ml</li>
        <li class="c-measure" style="opacity: 0;">0ml</li>`
    }
    else if (procent < 62.5){
        innerhtml = `
        <li class="c-measure" style="opacity: 0;" >2000ml</li>
        <li class="c-measure u-switch">1750ml</li>
        <li class="c-measure u-switch">1500ml</li>
        <li class="c-measure u-switch">1250ml</li>
        <li class="c-measure">1000ml</li>
        <li class="c-measure">750ml</li>
        <li class="c-measure">500ml</li>
        <li class="c-measure">250ml</li>
        <li class="c-measure" style="opacity: 0;">0ml</li>`
    }
    else if (procent < 75){
        innerhtml = `
        <li class="c-measure" style="opacity: 0;" >2000ml</li>
        <li class="c-measure u-switch">1750ml</li>
        <li class="c-measure u-switch">1500ml</li>
        <li class="c-measure">1250ml</li>
        <li class="c-measure">1000ml</li>
        <li class="c-measure">750ml</li>
        <li class="c-measure">500ml</li>
        <li class="c-measure">250ml</li>
        <li class="c-measure" style="opacity: 0;">0ml</li>`
    }
    else if (procent < 87.5){
        innerhtml = `
        <li class="c-measure" style="opacity: 0;" >2000ml</li>
        <li class="c-measure u-switch">1750ml</li>
        <li class="c-measure">1500ml</li>
        <li class="c-measure">1250ml</li>
        <li class="c-measure">1000ml</li>
        <li class="c-measure">750ml</li>
        <li class="c-measure">500ml</li>
        <li class="c-measure">250ml</li>
        <li class="c-measure" style="opacity: 0;">0ml</li>`
    }
    else {
        innerhtml = `
        <li class="c-measure" style="opacity: 0;" >2000ml</li>
        <li class="c-measure">1750ml</li>
        <li class="c-measure">1500ml</li>
        <li class="c-measure">1250ml</li>
        <li class="c-measure">1000ml</li>
        <li class="c-measure">750ml</li>
        <li class="c-measure">500ml</li>
        <li class="c-measure">250ml</li>
        <li class="c-measure" style="opacity: 0;">0ml</li>`     
    }
    htmlMeasurements.innerHTML = innerhtml

    if (procent < 62.5 ){
        htmlSwitchProgress.classList.add('u-switch')
    }
    else {
        htmlSwitchProgress.classList.remove('u-switch')
    }

    if (procent < 25){
        htmlSwitchInfo.classList.add('u-switch')
    }
    else {
        htmlSwitchInfo.classList.remove('u-switch')
    }

    if (procent >= 98){
        document.querySelector('.js-header').innerHTML =`
        <div class="c-nav">
            <span class="c-nav__item c-nav__button-left" style="opacity: 0;">
            <svg id="Return_button" data-name="Return button" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path id="Path_107" data-name="Path 107" d="M0,0H24V24H0Z" fill="none"/>
                <path id="Path_108" data-name="Path 108" d="M20,11H7.83l5.59-5.59L12,4,4,12l8,8,1.41-1.41L7.83,13H20Z" fill="#fff"/>
            </svg>
            
            </span>
            <span class="c-nav__item c-nav__logo">
                <svg xmlns="http://www.w3.org/2000/svg" width="84" height="26" viewBox="0 0 84 26">
                    <text id="Redrate" transform="translate(42 21)" fill="#fff" font-size="22" font-family="Inter-SemiBold, Inter"   font-weight="600"><tspan x="-41.73" y="0">Redrate</tspan></text>
                </svg>
            </span>
            <button class="c-nav__item c-nav__button-right js-settings-button">
                <svg id="settings_black_24dp" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path id="Path_111" data-name="Path 111" d="M0,0H24V24H0Z" fill="none"/>
                    <path id="Path_112" data-name="Path 112" d="M19.43,12.98A7.793,7.793,0,0,0,19.5,12a7.793,7.793,0,0,0-.07-.98l2.11-1.65a.5.5,0,0,0,.12-.64l-2-3.46a.5.5,0,0,0-.44-.25.467.467,0,0,0-.17.03l-2.49,1a7.306,7.306,0,0,0-1.69-.98l-.38-2.65A.488.488,0,0,0,14,2H10a.488.488,0,0,0-.49.42L9.13,5.07a7.683,7.683,0,0,0-1.69.98l-2.49-1a.566.566,0,0,0-.18-.03.5.5,0,0,0-.43.25l-2,3.46a.493.493,0,0,0,.12.64l2.11,1.65A7.931,7.931,0,0,0,4.5,12a7.931,7.931,0,0,0,.07.98L2.46,14.63a.5.5,0,0,0-.12.64l2,3.46a.5.5,0,0,0,.44.25.467.467,0,0,0,.17-.03l2.49-1a7.306,7.306,0,0,0,1.69.98l.38,2.65A.488.488,0,0,0,10,22h4a.488.488,0,0,0,.49-.42l.38-2.65a7.683,7.683,0,0,0,1.69-.98l2.49,1a.566.566,0,0,0,.18.03.5.5,0,0,0,.43-.25l2-3.46a.5.5,0,0,0-.12-.64Zm-1.98-1.71a5.343,5.343,0,0,1,.05.73c0,.21-.02.43-.05.73l-.14,1.13.89.7,1.08.84-.7,1.21-1.27-.51-1.04-.42-.9.68a5.857,5.857,0,0,1-1.25.73l-1.06.43-.16,1.13L12.7,20H11.3l-.19-1.35-.16-1.13-1.06-.43a5.674,5.674,0,0,1-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21,1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7L4.72,8.6l.7-1.21,1.27.51,1.04.42.9-.68a5.857,5.857,0,0,1,1.25-.73l1.06-.43.16-1.13L11.3,4h1.39l.19,1.35.16,1.13,1.06.43a5.674,5.674,0,0,1,1.23.71l.91.7,1.06-.43,1.27-.51.7,1.21-1.07.85-.89.7.14,1.13ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2.006,2.006,0,0,1,12,14Z" fill="#fff"/>
                </svg>                         
            </button>
        </div>
        `

    }
    else{
        document.querySelector('.js-header').innerHTML =`
        <div class="c-nav">
            <span class="c-nav__item c-nav__button-left" style="opacity: 0;">
            <svg id="Return_button" data-name="Return button" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path id="Path_107" data-name="Path 107" d="M0,0H24V24H0Z" fill="none"/>
                <path id="Path_108" data-name="Path 108" d="M20,11H7.83l5.59-5.59L12,4,4,12l8,8,1.41-1.41L7.83,13H20Z" fill="#fff"/>
            </svg>
            
            </span>
            <span class="c-nav__item c-nav__logo">
                <svg xmlns="http://www.w3.org/2000/svg" width="84" height="26" viewBox="0 0 84 26">
                    <text id="Redrate" transform="translate(42 21)" fill="#16181a" font-size="22" font-family="Inter-SemiBold, Inter"   font-weight="600"><tspan x="-41.73" y="0">Redrate</tspan></text>
                </svg>
            </span>
            <button class="c-nav__item c-nav__button-right js-settings-button">
                <svg id="settings_black_24dp" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path id="Path_111" data-name="Path 111" d="M0,0H24V24H0Z" fill="none"/>
                    <path id="Path_112" data-name="Path 112" d="M19.43,12.98A7.793,7.793,0,0,0,19.5,12a7.793,7.793,0,0,0-.07-.98l2.11-1.65a.5.5,0,0,0,.12-.64l-2-3.46a.5.5,0,0,0-.44-.25.467.467,0,0,0-.17.03l-2.49,1a7.306,7.306,0,0,0-1.69-.98l-.38-2.65A.488.488,0,0,0,14,2H10a.488.488,0,0,0-.49.42L9.13,5.07a7.683,7.683,0,0,0-1.69.98l-2.49-1a.566.566,0,0,0-.18-.03.5.5,0,0,0-.43.25l-2,3.46a.493.493,0,0,0,.12.64l2.11,1.65A7.931,7.931,0,0,0,4.5,12a7.931,7.931,0,0,0,.07.98L2.46,14.63a.5.5,0,0,0-.12.64l2,3.46a.5.5,0,0,0,.44.25.467.467,0,0,0,.17-.03l2.49-1a7.306,7.306,0,0,0,1.69.98l.38,2.65A.488.488,0,0,0,10,22h4a.488.488,0,0,0,.49-.42l.38-2.65a7.683,7.683,0,0,0,1.69-.98l2.49,1a.566.566,0,0,0,.18.03.5.5,0,0,0,.43-.25l2-3.46a.5.5,0,0,0-.12-.64Zm-1.98-1.71a5.343,5.343,0,0,1,.05.73c0,.21-.02.43-.05.73l-.14,1.13.89.7,1.08.84-.7,1.21-1.27-.51-1.04-.42-.9.68a5.857,5.857,0,0,1-1.25.73l-1.06.43-.16,1.13L12.7,20H11.3l-.19-1.35-.16-1.13-1.06-.43a5.674,5.674,0,0,1-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21,1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7L4.72,8.6l.7-1.21,1.27.51,1.04.42.9-.68a5.857,5.857,0,0,1,1.25-.73l1.06-.43.16-1.13L11.3,4h1.39l.19,1.35.16,1.13,1.06.43a5.674,5.674,0,0,1,1.23.71l.91.7,1.06-.43,1.27-.51.7,1.21-1.07.85-.89.7.14,1.13ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Zm0,6a2,2,0,1,1,2-2A2.006,2.006,0,0,1,12,14Z" fill="#45494d"/>
                </svg>                         
            </button>
        </div>
        `
    }
    DisplaySettings();
}

const init = function () {
    console.log('DOM content loaded');
    htmlTemperatuur = document.querySelector('.js-temperature');
    htmlVochtigheid = document.querySelector('.js-rhumidity')
    htmlSettings = document.querySelector('.js-settings');
    htmlDailyProgress = document.querySelector('.js-percentage');
    htmlWaterDrunk = document.querySelector('.js-info-waterdrunk');
    htmlBottlesWhole = document.querySelector('.js-info-bottles');
    htmlWaves = document.querySelector('.js-waves');
    htmlMeasurements = document.querySelector('.js-measurements');
    htmlSwitchProgress = document.querySelector('.js-switch-percentage')
    htmlSwitchInfo = document.querySelector('.js-switch-info')

    if (htmlTemperatuur){
        getTemp();
        getHum();
    }

    getDailyProgress();

    listenToSocket();
    DisplaySettings();
}

document.addEventListener('DOMContentLoaded', init);