const IMAGEKIT_CONFIG = {
    publicKey: "public_bawcFuqY3HLre7P4fMaC41yXkNY=",
    urlEndpoint: "https://ik.imagekit.io/h2ve38sl6",
    authEndpoint: "/api/imagekit-auth",
    folder: "/payment-proofs"
};

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

function sanitizeFileName(fileName) {
    return String(fileName || "payment-proof").replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadPaymentProof(file, transactionId) {
    if (!file) return "";

    const authResponse = await fetch(IMAGEKIT_CONFIG.authEndpoint);
    if (!authResponse.ok) {
        throw new Error("Payment screenshot upload could not be authorized. Please retry later or submit without a screenshot.");
    }

    const authData = await authResponse.json();
    if (!authData.token || !authData.expire || !authData.signature) {
        throw new Error("Payment screenshot upload authorization was incomplete. Please retry later or submit without a screenshot.");
    }

    const safeTransactionId = sanitizeFileName(transactionId || "transaction");
    const safeFileName = sanitizeFileName(file.name);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("fileName", safeTransactionId + "-" + Date.now() + "-" + safeFileName);
    uploadData.append("publicKey", IMAGEKIT_CONFIG.publicKey);
    uploadData.append("signature", authData.signature);
    uploadData.append("expire", authData.expire);
    uploadData.append("token", authData.token);
    uploadData.append("folder", IMAGEKIT_CONFIG.folder);
    uploadData.append("useUniqueFileName", "true");

    const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: uploadData
    });
    const imageKitData = await uploadResponse.json().catch(function () {
        return {};
    });

    if (!uploadResponse.ok || !imageKitData.url) {
        throw new Error(imageKitData.message || "Payment screenshot upload failed. Please retry later or submit without a screenshot.");
    }

    return imageKitData.url;
}

async function submitToWeb3Forms(formData) {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        body: formData
    });
    const data = await response.json().catch(function () {
        return {};
    });

    if (!response.ok || data.success === false) {
        throw new Error(data.message || "Submission failed. Please check your details and try again.");
    }

    return data;
}

function collectFormValues(formElement, prefix) {
    const values = {};
    const fields = formElement.querySelectorAll("input, select, textarea");

    Array.prototype.forEach.call(fields, function (field) {
        if (!field.name || field.type === "file") return;

        const key = prefix ? prefix + field.name : field.name;
        if (field.type === "checkbox") {
            if (!values[key]) values[key] = [];
            if (field.checked) values[key].push(field.value);
            return;
        }

        if (field.type === "radio") {
            if (field.checked) values[key] = field.value;
            return;
        }

        values[key] = field.value.trim();
    });

    Object.keys(values).forEach(function (key) {
        if (Array.isArray(values[key])) {
            values[key] = values[key].join(", ");
        }
    });

    return values;
}

window.DynamicBubbleForms = {
    IMAGEKIT_CONFIG: IMAGEKIT_CONFIG,
    sanitizeFileName: sanitizeFileName,
    uploadPaymentProof: uploadPaymentProof,
    submitToWeb3Forms: submitToWeb3Forms,
    collectFormValues: collectFormValues
};
