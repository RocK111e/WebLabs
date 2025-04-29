const path_prefix = 'api/app.php/';

export async function fetch_all_students() {
    const response = await fetch(path_prefix + 'students', 
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + sessionStorage.getItem('token')
            }
        }
    );
    if (response.status === 401) {
        window.location.href = "login.html";
    }
    // Check if the response is OK
    if (!response.ok) {
        return false;
    }
    
    // Parse the JSON response
    const data = await response.json();
    console.log(data);
    
    // Check for error in the response
    if (data.error) {
        return false;
    }

    return data;
}

export async function delete_student(id) {
    const response = await fetch(path_prefix + 'students/' + id, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        }
    });
    if (response.status === 401) {
        window.location.href = "login.html";
    }
    // Check if the response is OK
    if (!response.ok) {
        return false;
    }
    
    return true;
}

export async function post_student(group, first_name, last_name, gender, birthday){
    const response = await fetch(path_prefix + 'students', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        body: JSON.stringify({
            Group: group,
            Name: first_name,
            Surname: last_name,
            Gender: gender,
            Birthday: birthday}
        )
    });
    if (response.status === 401) {
        window.location.href = "login.html";
    }
    if (response.ok) {
        return true;
    }
    if (response.status === 409) {
        alert("This student already exists");
        return "This student already exists";
    }
    return false;
}

export async function put_student(id, group, first_name, last_name, gender, birthday){
    const response = await fetch(path_prefix + 'students/' + id, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        body: JSON.stringify({
            Group: group,
            Name: first_name,
            Surname: last_name,
            Gender: gender,
            Birthday: birthday})
        });
    if (response.status === 401) {
        window.location.href = "login.html";
    }
    if (response.ok) {
        return true;
    }
    if (response.status === 409) {
        alert("This student already exists");
        return "This student already exists";
    }
    return false;
}

export async function fetch_students_count() {
    const response = await fetch(path_prefix + 'students/count', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        }
    });
    if (response.status === 401) {
        window.location.href = "login.html";
    }
    if (!response.ok) {
        return false;
    }
    const response_text = await response.text();
    const data = parseInt(response_text, 10);
    if (!isNaN(data)) {
        console.log(data); // Use the integer
    } else {
        console.error('Response is not a valid integer');
        return false;
    }
    return data;
}

export async function login(login, password) {
    const response = await fetch(path_prefix + 'login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            Login: login,
            Password: password
        })
    });
    if (response.status === 401) {
        return "Invalid login or password";
    }
    const data = await response.json();
    const token = data['token'];
    console.log(token);
    if (token === undefined) {
        return false;
    }
    const name = data['Name'];
    console.log(name);
    if (name === undefined) {
        return false;
    }
    const surname = data['Surname'];
    console.log(surname);
    if (surname === undefined) {
        return false;
    }
    const user = name + ' ' + surname;
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', user);
    return true;
}

export async function logout() {
    const response = await fetch(path_prefix + 'logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        });
    if (response.ok) {
        sessionStorage.removeItem('token');
    }
    console.log(response);
    window.location.href = "login.html";
}