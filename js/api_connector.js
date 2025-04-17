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