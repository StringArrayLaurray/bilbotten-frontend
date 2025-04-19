// BotUI initialiseres
var botui = new BotUI('botui-app');

// første besked vises i chatten
botui.message.add({
    content: 'Hej 😄 Upload venligst et billede af en bil 🚗'
}).then(function () {
    return botui.action.button({
        action: [{ text: 'Upload', value: 'upload' }]
    });
}).then(function (res) {
    if (res.value === 'upload') {
        document.getElementById('image-upload').click();
    }
});

// når brugeren vælger billede
document.getElementById('image-upload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const imgUrl = URL.createObjectURL(file);
    botui.message.add({
        type: 'html',
        content: `<img src="${imgUrl}" class="chat-image">`
    });

    const loadingMsgRef = botui.message.add({
        type: 'html',
        cssClass: 'loading',
        content: `
          <span class="loader-dot"></span>
          <span class="loader-dot"></span>
          <span class="loader-dot"></span>
        `
    });

    fetch('http://localhost:8080/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(carInfo => {
            botui.message.remove(loadingMsgRef._id);

            return botui.message.add({
                type: 'html',
                content: `
                Her er informationen vi fandt:<br><br>
                Nummerplade: ${carInfo["registration_number"]}<br>
                Mærke: ${carInfo["make"]}<br>
                Model: ${carInfo["model"]}<br>
                Variant: ${carInfo["variant"]}<br>
                Årgang: ${carInfo["model_year"]}<br>
                Farve: ${carInfo["color"]}<br>
                Døre: ${carInfo["doors"]} | Sæder: ${carInfo["seats"]}<br>
                Brændstof: ${carInfo["fuel_type"]}<br>
                Motorkraft: ${carInfo["engine_power"]} hk<br>
                Vægt: ${carInfo["total_weight"]} kg
            `
            }).then(() => {
                const brand = carInfo["make"];
                const model = carInfo["model"];

                // slår bilen op i bilbasen vha. make og model
                const bilbasenUrl = `https://www.bilbasen.dk/brugt/bil?includeengros=false&make=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`;
                // vi kan tilføje flere hjemmesider ofc
                const brandSites = {
                    skoda: "https://www.skoda.dk",
                    audi: "https://www.audi.dk",
                    ford: "https://www.ford.dk",
                    toyota: "https://www.toyota.dk",
                    bmw: "https://www.bmw.dk",
                    mercedes: "https://www.mercedes-benz.dk"
                };

                const brandUrl = brandSites[brand.toLowerCase()] || `https://${brand.toLowerCase()}.com`;

                return botui.action.button({
                    action: [
                        { text: "Køb bilen på bilbasen", value: "bilbasen" },
                        { text: `Besøg ${brand}`, value: "brandsite" },
                        { text: "Upload ny bil", value: "upload" }
                    ]
                }).then(res => {
                    if (res.value === "bilbasen") {
                        window.open(bilbasenUrl, "_blank");
                    } else if (res.value === "brandsite") {
                        window.open(brandUrl, "_blank");
                    } else if (res.value === "upload") {
                        document.getElementById('image-upload').click();
                        return; // stop efter upload
                    }

                    // tilbyder upload bagefter igen så chatten kan blive ved
                    return botui.action.button({
                        delay: 1000,
                        action: [
                            { text: "📷 Upload ny bil", value: "upload" }
                        ]
                    }).then((res) => {
                        if (res.value === "upload") {
                            document.getElementById('image-upload').click();
                        }
                    });
                });
            });
        })
        .catch(error => {
            botui.message.remove(loadingMsgRef._id);
            botui.message.add({ content: 'Hov, noget gik galt' });
            console.error(error);
        });
});
