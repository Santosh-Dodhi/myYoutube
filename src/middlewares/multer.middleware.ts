import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) { //multer has this file and cb here represents as callback 
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    // TODO:: do check console.log(file)
    cb(null, file.originalname)
  }
})


export const upload = multer({ 
  storage: storage 
})