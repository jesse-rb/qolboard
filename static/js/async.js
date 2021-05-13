// Asyncronous script call functions

// Async GET
function asyncGet(url, callback) {
    // Start session
    fetch(url)
    .then(function(response) {
        if (response.status !== 200) {
            console.log('Error: ' + response.status); // Handle error code from server
        } else {
            response.json().then(function(data) {
                callback && callback(data); // Callback function
            });
        }
    }).catch(function(error) {
        console.log('Error: ' + error); // Catch error
    });
}

// Async POST
function asyncPost(url, callback, contentType, body) {
    let ct = undefined;
    if (contentType === 'json') {
        ct = 'application/json'
    } else if (contentType === 'form') {
        ct = 'application/x-www-form-urlencoded; charset=UTF-8';
    }
    fetch(url, {
            method: 'POST',
            headers: {
                'Accept': ct,
                'Content-Type': ct
            },
            body: JSON.stringify(body)
        }
    ).then(function(response) {
        if (response.status !== 200) {
            console.log('Error: ' + response.status); // Handle error code from server
        } else {
            response.json().then(function(data) {
                callback && callback(data); // Callback function
            });
        }
    }).catch(function(error) {
        console.log('Error: ' + error); // Catch error
    });
}