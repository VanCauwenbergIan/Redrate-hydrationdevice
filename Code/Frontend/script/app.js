const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);

let htmlTemperatuur, htmlVochtigheid, htmlDailyProgress, htmlWaterDrunk, htmlBottlesWhole, htmlBottlesFraction, htmlSwitchProgress, htmlSwitchInfo, htmlWarning, htmlNotification, Globalprocent;

// callback-visualisation -show

const showTemp = function(jsonObject){
    console.log(jsonObject);
    updateTemperatuur(jsonObject.temperatuur.gemetenwaarde);
}

const showHum = function(jsonObject){
    console.log(jsonObject);
    updateVochtigheid(jsonObject.vochtigheid.gemetenwaarde);
}

const showWarning = function(jsonObject){
    console.log(jsonObject);
    listenToConditions(jsonObject.temperatuur.gemetenwaarde,jsonObject.vochtigheid.gemetenwaarde)
    let Globalamount = document.querySelector('.js-dropdown').value;
    updateMeasurements(Globalprocent, Globalamount);
}

const showSummary = function(jsonObject){
    console.log(jsonObject);
    let Globalamount = jsonObject.globalamount;
    let zondag = 0, maandag = 0, dinsdag = 0, woensdag = 0, donderdag = 0, vrijdag = 0, zaterdag = 0;
    let weekObject = jsonObject.week
    let baseline = 0;
    for (let i = 0; i < weekObject.length; i++){
        let gewicht = weekObject[i].gemetenwaarde
        if (i == 0){
            baseline = weekObject[0].gemetenwaarde
            console.log(`Nieuwe fles: inhoud ${baseline/1000} l`)
        }
        if (i >= 1){
            let vorig_gewicht = weekObject[i - 1].gemetenwaarde
            if (gewicht < vorig_gewicht){
                let verschil = (vorig_gewicht - gewicht)/1000;
                let dag = weekObject[i].dag
                if (dag == 1){
                    zondag += verschil
                }
                else if (dag == 2){
                    maandag += verschil
                }
                else if (dag == 3){
                    dinsdag += verschil
                }
                else if (dag == 4){
                    woensdag += verschil
                }
                else if (dag == 5){
                    donderdag += verschil
                }
                else if (dag == 6){
                    vrijdag += verschil
                }
                else if (dag == 7){
                    zaterdag += verschil
                }
            }
            else{
                baseline = gewicht                
            }
        }
    }
    let ArrayWeek = [maandag, dinsdag, woensdag, donderdag, vrijdag, zaterdag, zondag];
    console.log(`Week verwerkt: ${ArrayWeek}`)

    let totaal = 0;
    for (let i = 0; i < ArrayWeek.length; i++){
        totaal += ArrayWeek[i];
    }

    updateSummary(ArrayWeek);

    let innerhtml = ''
    document.querySelector('.js-waterweek').innerHTML = `${Math.round(totaal * 1000)} ml`
    document.querySelector('.js-average').innerHTML = `${Math.round(totaal * 1000 / 7)} ml / day`
    if ((Math.round(totaal / 7)) >= Globalamount){
        innerhtml = 'Keep it up!'
    }
    else {
        innerhtml = 'Try to drink more water!'
    }
    document.querySelector('.js-conclussion').innerHTML = innerhtml;
}

const showDailyProgress = function(jsonObject){
    console.log(jsonObject)
    let Globalamount = jsonObject.globalamount;
    if (jsonObject.progress.length > 0){
        let progress = 0;
        let baseline = 0;
        console.log(jsonObject.progress);
        // console.log(baseline);
        for (let i = 0; i < jsonObject.progress.length; i++){
            let gewicht = jsonObject.progress[i].gemetenwaarde
            if (i == 0){
                baseline = jsonObject.progress[0].gemetenwaarde
            }
            if (i >= 1){
                let vorig_gewicht = jsonObject.progress[i - 1].gemetenwaarde
                if (gewicht < vorig_gewicht){
                    let verschil = (vorig_gewicht - gewicht)/1000;
                    progress += verschil;
                }
                else{
                    baseline = gewicht
                    console.log(`Nieuwe fles: inhoud ${baseline/1000} l`)
                }
            }
        }
        progress 
        socket.emit("F2B_progress", { Progress: progress});
        let progress_in_procent = (progress / Globalamount * 100).toFixed(2);

        if (htmlDailyProgress){
            htmlDailyProgress.innerHTML = progress_in_procent
            htmlWaterDrunk.innerHTML = progress.toFixed(3) + ' l'
            if (progress <= Globalamount){
                htmlBottlesWhole.innerHTML = Math.floor((Globalamount - progress)/(baseline/1000))
                htmlBottlesFraction.innerHTML = ` ${fraction(((Globalamount - progress)/(baseline/1000) -  Math.floor((Globalamount - progress)/(baseline/1000))).toFixed(1))}`
            }
            else {
                htmlBottlesWhole.innerHTML = 0;
                htmlBottlesFraction.innerHTML = 0;
            }
            updateWaves(progress_in_procent, Globalamount);

            if (progress > 2){
               document.querySelector('.js-2liter-message').classList.remove('u-display-none-o');
            }
            else {
                document.querySelector('.js-2liter-message').classList.add('u-display-none-o');
            }
        }
        else {
            let liter = ((progress_in_procent / 100) * Globalamount).toFixed(4);
            console.log(`liter: ${liter}`)
            innerhtml = `${Math.round(liter * 1000)} ml / ${Globalamount*1000} ml`;
            document.querySelector('.js-waterdrunk').innerHTML = innerhtml;
        }
    }
    else {
        let baseline = 500;

        htmlDailyProgress.innerHTML = 0;
        htmlWaterDrunk.innerHTML = 0 + ' l';
        htmlBottlesWhole.innerHTML = Globalamount/(baseline/1000);
    
        updateWaves(0, Globalamount);
    }
}

const callBackSettings = function(jsonObject){
    console.log(jsonObject);
}

// data access -get

const getTemp = function(){
    handleData(`http://192.168.168.168:5000/api/v1/today/temp`, showTemp);
}

const getHum = function(){
    handleData(`http://192.168.168.168:5000/api/v1/today/hum`, showHum); 
}

const getWarning = function(){
    handleData(`http://192.168.168.168:5000/api/v1/today/warning`, showWarning); 
}

const getDailyProgress = function(){
    handleData(`http://192.168.168.168:5000/api/v1/today/prog`, showDailyProgress);
}

const getSummary = function(){
    handleData(`http://192.168.168.168:5000/api/v1/week`, showSummary);
}

// socket listeners

const listenToSocket = function(){
    socket.on("B2F_addlog", function (jsonObject){
        let temp = 0;
        let rv = 0;
        console.log(`boodschap server: aangepaste waarde of status`);
        if (jsonObject.deviceid == 4){
            console.log(`Nieuwe temperatuur: ${jsonObject.gemetenwaarde}°C`);
            temp = jsonObject.gemetenwaarde;
            updateTemperatuur(temp);
        }
        else if (jsonObject.deviceid == 3){
            console.log(`Nieuwe relatieve luchtvochtigheid: ${jsonObject.gemetenwaarde}%`);
            rv = jsonObject.gemetenwaarde
            updateVochtigheid(rv);
        }
        else if (jsonObject.deviceid == 2){
            console.log(`Nieuwe waarde fles: ${jsonObject.gemetenwaarde}`);
            if (htmlDailyProgress){
                getDailyProgress();
            }
        }
        listenToConditions(temp, rv)
    })
    socket.on("B2F_new_settings", function (jsonObject){
        if (htmlDailyProgress){
            document.querySelector('.js-notification-message').innerHTML = `Notification period changed to ${jsonObject.period}min, Daily amount changed to ${jsonObject.dailyamount}l`;
            htmlNotification.classList.remove("u-display-none");
            setTimeout (function(){
                htmlNotification.classList.add("u-display-none");
                updateMeasurements(Globalprocent, jsonObject.dailyamount);
            }, 5000);
        }
        if (jsonObject.period >= 1){
            document.querySelector('.js-period').value = jsonObject.period;
        }
        document.querySelector('.js-dropdown').value = jsonObject.dailyamount;
    })
}

const DisplaySettings = function(){
    const button = document.querySelector('.js-settings-button');
    button.addEventListener("click", function(){
        htmlSettings.classList.remove("u-display-none");
    })
    RemoveSettings();
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
        let Periode = document.querySelector('.js-period').value;
        let amount = document.querySelector('.js-dropdown').value;
        
        htmlSettings.classList.add("u-display-none");

        socket.emit("F2B_new_settings", { Periode: Periode, DailyAmount: amount , Mode: status });

        getDailyProgress();

        if (htmlDailyProgress){
            updateMeasurements(Globalprocent, amount);
        }
    })
}

const listenToClickWarningYes = function(){
    const button = document.querySelector('.js-warning-yes');
    button.addEventListener("click", function(){
        htmlWarning.classList.add('u-display-none')
        htmlSettings.classList.remove("u-display-none");
        RemoveSettings();
        let Globalamount = document.querySelector('.js-dropdown').value;
        updateMeasurements(Globalprocent , Globalamount);
    })
}

const listenToClickWarningNo = function(){
    const button = document.querySelector('.js-warning-no');
    button.addEventListener("click", function(){
        htmlWarning.classList.add('u-display-none');
        let Globalamount = document.querySelector('.js-dropdown').value;
        updateMeasurements(Globalprocent, Globalamount);
    })
}

const listenToConditions = function(temperatuur, rvocht){
    if (htmlDailyProgress){
        if (temperatuur >= 25 && rvocht <= 30){
            document.querySelector('.js-warning-content').innerHTML = "Looks like it's hot and dry today!"
            htmlWarning.classList.remove('u-display-none')
        }
        else if (temperatuur >= 25){
            document.querySelector('.js-warning-content').innerHTML = "Looks like it's hot today!"
            htmlWarning.classList.remove('u-display-none')
        }
        else if (rvocht <= 30){
            document.querySelector('.js-warning-content').innerHTML = "Looks like it's dry today!"
            htmlWarning.classList.remove('u-display-none')
        }
        else {
            htmlWarning.classList.add('u-display-none')
        }
        listenToClickWarningYes();
        listenToClickWarningNo();
    }
}

// functies voor socket listeners

const updateTemperatuur = function(temperatuur){
    htmlTemperatuur.innerHTML = `${temperatuur}°C`;
}

const updateVochtigheid = function(vochtigheid){
    htmlVochtigheid.innerHTML = `${vochtigheid}%`
}

const updateWaves = function(procent, dailyamount){
    if (dailyamount <= 1.75){
        procent =  Math.round(((procent / 100 /2) * dailyamount) * 100)
    }
    else {
        procent =  Math.round(((procent / 100 /3) * dailyamount) * 100) 
    }
    Globalprocent = procent; // bijgemaakt voor warning (anders is bij een translateY van 0% het logo enzv. niet zichtbaar)
   if (procent <= 100){
        htmlWaves.style.transform = `translateY(${100 - procent}%)`;
        updateMeasurements(procent, dailyamount);
   }
   else{
        htmlWaves.style.transform = `translateY(${0}%)`;
        updateMeasurements(100, dailyamount);
   }
}

const updateMeasurements = function(procent, dailyamount){
    let innerhtml = ''

    if (dailyamount <= 1.75){
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
    }
    else {
        if (procent < 8){
            innerhtml = `
            <li class="c-measure u-switch" style="opacity: 0;">3000ml</li>
            <li class="c-measure u-switch" >2750ml</li>
            <li class="c-measure u-switch" >2500ml</li>
            <li class="c-measure u-switch" >2250ml</li>
            <li class="c-measure u-switch" >2000ml</li>
            <li class="c-measure u-switch">1750ml</li>
            <li class="c-measure u-switch">1500ml</li>
            <li class="c-measure u-switch">1250ml</li>
            <li class="c-measure u-switch">1000ml</li>
            <li class="c-measure u-switch">750ml</li>
            <li class="c-measure u-switch">500ml</li>
            <li class="c-measure u-switch">250ml</li>
            <li class="c-measure" style="opacity: 0;">0ml</li>`
        }
        else if (procent < 16.5){
            innerhtml = `
            <li class="c-measure u-switch" style="opacity: 0;">3000ml</li>
            <li class="c-measure u-switch" >2750ml</li>
            <li class="c-measure u-switch" >2500ml</li>
            <li class="c-measure u-switch" >2250ml</li>
            <li class="c-measure u-switch" >2000ml</li>
            <li class="c-measure u-switch">1750ml</li>
            <li class="c-measure u-switch">1500ml</li>
            <li class="c-measure u-switch">1250ml</li>
            <li class="c-measure u-switch">1000ml</li>
            <li class="c-measure u-switch">750ml</li>
            <li class="c-measure u-switch">500ml</li>
            <li class="c-measure">250ml</li>
            <li class="c-measure" style="opacity: 0;">0ml</li>`
        }
        else if (procent < 25){
            innerhtml = `
            <li class="c-measure u-switch" style="opacity: 0;">3000ml</li>
            <li class="c-measure u-switch" >2750ml</li>
            <li class="c-measure u-switch" >2500ml</li>
            <li class="c-measure u-switch" >2250ml</li>
            <li class="c-measure u-switch" >2000ml</li>
            <li class="c-measure u-switch">1750ml</li>
            <li class="c-measure u-switch">1500ml</li>
            <li class="c-measure u-switch">1250ml</li>
            <li class="c-measure u-switch">1000ml</li>
            <li class="c-measure u-switch">750ml</li>
            <li class="c-measure">500ml</li>
            <li class="c-measure">250ml</li>
            <li class="c-measure" style="opacity: 0;">0ml</li>`
        }
        else if (procent < 33){
            innerhtml = `
            <li class="c-measure u-switch" style="opacity: 0;">3000ml</li>
            <li class="c-measure u-switch" >2750ml</li>
            <li class="c-measure u-switch" >2500ml</li>
            <li class="c-measure u-switch" >2250ml</li>
            <li class="c-measure u-switch" >2000ml</li>
            <li class="c-measure u-switch">1750ml</li>
            <li class="c-measure u-switch">1500ml</li>
            <li class="c-measure u-switch">1250ml</li>
            <li class="c-measure u-switch">1000ml</li>
            <li class="c-measure">750ml</li>
            <li class="c-measure">500ml</li>
            <li class="c-measure">250ml</li>
            <li class="c-measure" style="opacity: 0;">0ml</li>`
        }
        else if (procent < 41.5){
            innerhtml = `
            <li class="c-measure u-switch" style="opacity: 0;">3000ml</li>
            <li class="c-measure u-switch" >2750ml</li>
            <li class="c-measure u-switch" >2500ml</li>
            <li class="c-measure u-switch" >2250ml</li>
            <li class="c-measure u-switch" >2000ml</li>
            <li class="c-measure u-switch">1750ml</li>
            <li class="c-measure u-switch">1500ml</li>
            <li class="c-measure u-switch">1250ml</li>
            <li class="c-measure">1000ml</li>
            <li class="c-measure">750ml</li>
            <li class="c-measure">500ml</li>
            <li class="c-measure">250ml</li>
            <li class="c-measure" style="opacity: 0;">0ml</li>`
        }
        else if (procent < 50){
            innerhtml = `
            <li class="c-measure u-switch" style="opacity: 0;">3000ml</li>
            <li class="c-measure u-switch" >2750ml</li>
            <li class="c-measure u-switch" >2500ml</li>
            <li class="c-measure u-switch" >2250ml</li>
            <li class="c-measure u-switch" >2000ml</li>
            <li class="c-measure u-switch">1750ml</li>
            <li class="c-measure u-switch">1500ml</li>
            <li class="c-measure">1250ml</li>
            <li class="c-measure">1000ml</li>
            <li class="c-measure">750ml</li>
            <li class="c-measure">500ml</li>
            <li class="c-measure">250ml</li>
            <li class="c-measure" style="opacity: 0;">0ml</li>`
        }
        else if (procent < 58){
            innerhtml = `
            <li class="c-measure u-switch" style="opacity: 0;">3000ml</li>
            <li class="c-measure u-switch" >2750ml</li>
            <li class="c-measure u-switch" >2500ml</li>
            <li class="c-measure u-switch" >2250ml</li>
            <li class="c-measure u-switch" >2000ml</li>
            <li class="c-measure u-switch">1750ml</li>
            <li class="c-measure">1500ml</li>
            <li class="c-measure">1250ml</li>
            <li class="c-measure">1000ml</li>
            <li class="c-measure">750ml</li>
            <li class="c-measure">500ml</li>
            <li class="c-measure">250ml</li>
            <li class="c-measure" style="opacity: 0;">0ml</li>`
        }
        else if (procent < 66.5) {
            innerhtml = `
            <li class="c-measure u-switch" style="opacity: 0;">3000ml</li>
            <li class="c-measure u-switch" >2750ml</li>
            <li class="c-measure u-switch" >2500ml</li>
            <li class="c-measure u-switch" >2250ml</li>
            <li class="c-measure u-switch" >2000ml</li>
            <li class="c-measure">1750ml</li>
            <li class="c-measure">1500ml</li>
            <li class="c-measure">1250ml</li>
            <li class="c-measure">1000ml</li>
            <li class="c-measure">750ml</li>
            <li class="c-measure">500ml</li>
            <li class="c-measure">250ml</li>
            <li class="c-measure" style="opacity: 0;">0ml</li>`
        }
        else if (procent < 75) {
            innerhtml = `
            <li class="c-measure u-switch" style="opacity: 0;">3000ml</li>
            <li class="c-measure u-switch" >2750ml</li>
            <li class="c-measure u-switch" >2500ml</li>
            <li class="c-measure u-switch" >2250ml</li>
            <li class="c-measure" >2000ml</li>
            <li class="c-measure">1750ml</li>
            <li class="c-measure">1500ml</li>
            <li class="c-measure">1250ml</li>
            <li class="c-measure">1000ml</li>
            <li class="c-measure">750ml</li>
            <li class="c-measure">500ml</li>
            <li class="c-measure">250ml</li>
            <li class="c-measure" style="opacity: 0;">0ml</li>`
        }
        else if (procent < 83) {
            innerhtml = `
            <li class="c-measure u-switch" style="opacity: 0;">3000ml</li>
            <li class="c-measure u-switch" >2750ml</li>
            <li class="c-measure u-switch" >2500ml</li>
            <li class="c-measure" >2250ml</li>
            <li class="c-measure" >2000ml</li>
            <li class="c-measure">1750ml</li>
            <li class="c-measure">1500ml</li>
            <li class="c-measure">1250ml</li>
            <li class="c-measure">1000ml</li>
            <li class="c-measure">750ml</li>
            <li class="c-measure">500ml</li>
            <li class="c-measure">250ml</li>
            <li class="c-measure" style="opacity: 0;">0ml</li>`
        }
        else if (procent < 91.5) {
            innerhtml = `
            <li class="c-measure u-switch" style="opacity: 0;">3000ml</li>
            <li class="c-measure u-switch" >2750ml</li>
            <li class="c-measure" >2500ml</li>
            <li class="c-measure" >2250ml</li>
            <li class="c-measure" >2000ml</li>
            <li class="c-measure">1750ml</li>
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
            <li class="c-measure u-switch" style="opacity: 0;">3000ml</li>
            <li class="c-measure" >2750ml</li>
            <li class="c-measure" >2500ml</li>
            <li class="c-measure" >2250ml</li>
            <li class="c-measure" >2000ml</li>
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
    }

    if (procent < 91.5){
        document.querySelector('.js-temp-hum').classList.add('u-switch')      
    }
    else {
        document.querySelector('.js-temp-hum').classList.remove('u-switch')
    }

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

    if (procent >= 98 && htmlNotification.classList.contains("u-display-none") == 1 && htmlWarning.classList.contains("u-display-none") == 1){
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


const updateSummary = function(week){
    console.log(week);
    for (let i = 0; i < week.length; i++){
        if (week[i] <= 3){
            week[i] = Math.round(week[i] / 3 * 100);
        }
        else {
            week[i] = 100;
        }
    }
    document.querySelector('.js-chart').innerHTML = `
    <tr>
    <td>
        <!-- Mon bar -->
        <div class="bar vert-bar ${lightBar(week[0])}" style="height: ${week[0]}%;"></div>
    </td>
    <td>
        <!-- Tue bar -->
        <div class="bar vert-bar ${lightBar(week[1])}" style="height: ${week[1]}%;"></div>
    </td>
    <td>
        <!-- Wed bar -->
        <div class="bar vert-bar ${lightBar(week[2])}" style="height: ${week[2]}%;"></div>
    </td>
    <td>
      <!-- Tue bar -->
      <div class="bar vert-bar ${lightBar(week[3])}" style="height: ${week[3]}%;"></div>
    </td>
    <td>
      <!-- Fri bar -->
      <div class="bar vert-bar ${lightBar(week[4])}" style="height: ${week[4]}%;"></div>
    </td>
    <td>
      <!-- Sat bar -->
      <div class="bar vert-bar ${lightBar(week[5])}" style="height: ${week[5]}%;"></div>
    </td>
    <td>
      <!-- Sun bar -->
      <div class="bar vert-bar ${lightBar(week[6])}" style="height: ${week[6]}%;"></div>
      </td>
    </tr>
    <tr class="days">
        <td class="day">Mon</td>
        <td class="day">Tue</td>
        <td class="day">Wed</td>
        <td class="day">Thu</td>
        <td class="day">Fri</td>
        <td class="day">Sat</td>
        <td class="day">Sun</td>
    </tr>`

}


const updatePeriod = function(){
    socket.emit("F2B_get_settings")
    socket.on("B2F_settings", function (jsonObject){
        console.log(jsonObject)
        if (jsonObject.period >= 1){
            document.querySelector('.js-period').value = jsonObject.period;
        }
        document.querySelector('.js-dropdown').value = jsonObject.dailyamount;
        getDailyProgress();
    })
}

const fraction = function(getal) {
    let fraction = getal - Math.floor(getal);
    let pre = Math.pow(10, /\d*$/.exec(new String(getal))[0].length);
    const gcd = function(fraction, pre) {
      if (!pre)
        return fraction;
      return gcd(pre, fraction % pre);
    }
    let ggd = gcd(Math.round(fraction * pre), pre);
    var noemer = pre / ggd;
    var teller = Math.round(fraction * pre) / ggd;
  
    if (teller > 0){
        return teller + "/" + noemer;
    }
    else {
        return 0;
    }
  }

const lightBar = function(procent) {
    if (procent < 50){
        return 'bar--light'
    }
    else {
        return ''
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
    htmlBottlesFraction = document.querySelector('.js-fraction-bottles')
    htmlWaves = document.querySelector('.js-waves');
    htmlMeasurements = document.querySelector('.js-measurements');
    htmlSwitchProgress = document.querySelector('.js-switch-percentage');
    htmlSwitchInfo = document.querySelector('.js-switch-info');
    htmlWarning = document.querySelector('.js-warning');
    htmlNotification = document.querySelector('.js-warning-notification');

    updatePeriod();


    getTemp();
    getHum();

    if(!htmlDailyProgress){
        getSummary();
    }


    if(htmlDailyProgress){
        getWarning();
    }

    getDailyProgress();

    listenToSocket();
    listenToClickConfirm();
    DisplaySettings();
}
document.addEventListener('DOMContentLoaded', init);