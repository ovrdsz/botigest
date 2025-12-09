export const validateRut = (rut) => {
    if (!rut) return false;

    // Clean RUT: remove dots and dash
    const cleanRut = rut.replace(/[^0-9kK]/g, '');

    if (cleanRut.length < 8) return false;

    const body = cleanRut.slice(0, -1);
    let dv = cleanRut.slice(-1).toUpperCase();

    // Check if body is numeric
    if (!/^\d+$/.test(body)) return false;

    // Calculate DV
    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
        sum += multiplier * parseInt(body.charAt(i), 10);
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDvResult = 11 - (sum % 11);
    let expectedDv = expectedDvResult.toString();

    if (expectedDvResult === 11) expectedDv = '0';
    if (expectedDvResult === 10) expectedDv = 'K';

    return dv === expectedDv;
};

export const formatRut = (rut) => {
    if (!rut) return '';

    const cleanRut = rut.replace(/[^0-9kK]/g, '');
    if (cleanRut.length <= 1) return cleanRut;

    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    // Format body with dots
    let formattedBody = '';
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
        if (j > 0 && j % 3 === 0) formattedBody = '.' + formattedBody;
        formattedBody = body.charAt(i) + formattedBody;
    }

    return `${formattedBody}-${dv}`;
};

export const validateEmail = (email) => {
    // Strict regex
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
};
