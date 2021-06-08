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

            if (progress < 2){
                
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

        updateWaves(100);
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
        let status = document.querySelector('.js-mode').value
        if (status == 'on'){
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
    // procent = 98
   if (procent <= 100){
        htmlWaves.style.transform = `translateY(${100 - procent}%)`;
        updateMeasurements(procent);
   }
   else {
        htmlWaves.style.transform = `translateY(${100 - 100}%)`;
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

    if (procent <= 62.5 ){
        htmlSwitchProgress.classList.add('u-switch')
    }
    else {
        htmlSwitchProgress.classList.remove('u-switch')
    }

    if (procent <= 25){
        htmlSwitchInfo.classList.add('u-switch')
    }
    else {
        htmlSwitchInfo.classList.remove('u-switch')
    }


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