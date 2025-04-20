const path_prefix = 'api/app.php/';

export async function fetch_all_students() {
    const response = await fetch(path_prefix + 'students');
    
    // Check if the response is OK
    if (!response.ok) {
        return false;
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    // Check for error in the response
    if (data.error) {
        return false;
    }

    return data;
}

export async function delete_student(id) {
    const response = await fetch(path_prefix + 'students/' + id, {
        method: 'DELETE'
    });
    
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
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Group: group,
            Name: first_name,
            Surname: last_name,
            Gender: gender,
            Birthday: birthday}
        )
    });
    
    if (response.ok) {
        return true;
    }
    if (response.status === 409) {
        return "This student already exists";
    }
    return false;
}

export async function put_student(id, group, first_name, last_name, gender, birthday){
    const response = await fetch(path_prefix + 'students/' + id, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Group: group,
            Name: first_name,
            Surname: last_name,
            Gender: gender,
            Birthday: birthday})
        });
    if (response.ok) {
        return true;
    }
    if (response.status === 409) {
        return "This student already exists";
    }
    return false;
}