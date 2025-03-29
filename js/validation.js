//Bool to validate the form with regex or JS
let regex = true;
const name_regex = /^[a-zA-Z]{2,50}$/;

function not_allowed_chars(str) {
    const allowed_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let has_not_allowed = false;
    for (let char of str) {
        if (!allowed_chars.includes(char)) {
            has_not_allowed = true;
            break;
        }
    }
    return has_not_allowed;
}

export function validate_name(name)
{
    if(regex){
        console.log("Validating name with regex");
        if (!name_regex.test(name)) {
            return "Invalid name format";
        }
        return true;
    }
    else{
        console.log("Validating name with JS");
        if (name.trim() === "") {
            return "Name cannot be empty";
        }
        if (name.length < 2) {
            return "Name must be at least 2 characters long";
        }
        if (name.length > 50) {
            return "Name must be at most 50 characters long";
        }
        if (not_allowed_chars(name)) {
            return "Name must contain only letters";
        }
        return true;
    }
}

export function validate_date(date)
{
    const inputDate = new Date(date);
    const today = new Date();
    const minDate = new Date("1901-01-01");
    
    if (inputDate > today) {
        return "Date cannot be in the future";
    }
    if (inputDate < minDate) {
        return "Date cannot be earlier than 1901-01-01";
    }
    return true;
}