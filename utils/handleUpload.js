import cloudinary from "../config/cloudinaryConfig.js"

async function handleUpload(file) {
    const res = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
    });
    return res;
}

export default handleUpload;