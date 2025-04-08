var botui = new BotUI('botui-app');


botui.message.add({
    content: 'Hej 😄 Upload venligst et billede af en bil 🚗'
}).then(function () {
    return botui.action.button({
        action: [
            { text: 'Upload', value: 'upload' },
        ]
    });
}).then(function (res) {
    if (res.value === 'upload') {
        document.getElementById('image-upload').click(); // åbner filvælger
    }
});

// Når brugeren vælger billede
document.getElementById('image-upload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    fetch('http://localhost:8080/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.text())
        .then(data => {
            botui.message.add({
                content: 'Billedet blev sendt! Backend svarede: ' + data
            });
        })
        .catch(error => {
            botui.message.add({ content: 'hov, siden er under ombygning' });
            console.error(error);
        });

    const imgUrl = URL.createObjectURL(file);
    botui.message.add({
        type: 'html',
        content: `<img src="${imgUrl}" class="chat-image">`
    });
});
