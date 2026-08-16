export const removeVietnameseTones = (str: string): string => {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .trim();
};

export const generateEmailFromFullName = (fullName: string): string => {
    const normalized = removeVietnameseTones(fullName).toLowerCase();
    const parts = normalized.split(/\s+/).filter(Boolean);

    if (parts.length === 0) return '';

    const givenName = parts[parts.length - 1];           
    const initials = parts
        .slice(0, -1)
        .map((p) => p.charAt(0))
        .join('');                                        

    const randomDigits = Math.floor(100000 + Math.random() * 900000); 

    return `${givenName}${initials}${randomDigits}@f-corp.com`;
};