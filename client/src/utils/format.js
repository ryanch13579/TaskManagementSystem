export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const formatDate = (value) => new Date(value).toLocaleDateString();
