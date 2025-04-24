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

    fetch('http://localhost:8080/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(carInfo => {
            const regNumber = carInfo["registration_number"];

            if (!regNumber || regNumber.toLowerCase() === "null") {
                return botui.message.add({
                    content: "Vi kunne ikke finde en nummerplade på billedet 😔 Prøv venligst med et andet billede 📷"
                }).then(() => {
                    return botui.action.button({
                        action: [
                            { text: "📷 Prøv igen", value: "upload" }
                        ]
                    }).then(res => {
                        if (res.value === "upload") {
                            document.getElementById('image-upload').click();
                        }
                    });
                });
            }


            // hvis nummerplade blev fundet – vis alle oplysninger
            return botui.message.add({
                type: 'html',
                content: `
                    Her er informationen vi fandt:<br><br>
                    Nummerplade: ${regNumber}<br>
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

                const bilbasenUrl = `https://www.bilbasen.dk/brugt/bil/${brand.toLowerCase()}/${model.toLowerCase()}`;
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
                        return;
                    }

                    // tilbyder upload bagefter igen
                    return botui.action.button({
                        delay: 1000,
                        action: [{ text: "📷 Upload ny bil", value: "upload" }]
                    }).then((res) => {
                        if (res.value === "upload") {
                            document.getElementById('image-upload').click();
                        }
                    });
                });
            });
        })
        .catch(error => {
            botui.message.add({ content: 'Hov, noget gik galt 😓' });
            console.error(error);
        });
});
