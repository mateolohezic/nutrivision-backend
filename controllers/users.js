const User = require('../model/users');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const moment = require('moment');
const { createLog } = require('../controllers/log');
require('dotenv').config();
const secretToken = process.env.SECRET_TOKEN
const emailUser = process.env.EMAIL_USER
const emailPassword = process.env.EMAIL_PASSWORD

const getUser = async (req, res) => {
  try {
    const users = await User.find({})
    res.status(200).send(users);
  } catch (error) {
    res.status(206).json({ error: error.message });
  }
}

// GET USER CON TOKEN:
const getUserEspecifico = async (req, res) => {
  try {
    const token = req.params.token;
    if (!token) {
      return res.status(401).json({ message: 'No se encontró el token.' });
    }
    const { userId } = jwt.verify(token, secretToken);
    try {
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'El usuario no existe.' });
        return 
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Token invalido.' });
    } else if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Su sesión expiro.' });
    } else {
      res.status(500).json({ message: 'Ocurrió un error inesperado.' });
    }
  }
};

// GET USER CON ID DE MONGOOSE:
const getUserEspecificoId = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(206).send('Invalid user ID');
  } else {
    try {
      const user = await User.findById(id);
      res.status(200).send(user);
    } catch (error) {
      res.status(206).json({ error: error.message });
    }
  }
}

const searchResults = async (req, res) => {
  const { search } = req.params;

  if (!search || search === 'Undefined') {
    res.status(400).json({})
    return
  }
  try {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { surname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { venture: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ]
    });
    res.status(200).send(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error:"Email can't be empty" });
  }

  if (!password) {
    return res.status(400).json({ error:"Password can't be empty" });
  }

  try {
    const user = await User.findOne({ email });
    
    if (!user || !user.status ) {
        return res.status(401).json({ error:"Datos incorrectos." });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ error:"Datos incorrectos." });
    }

    const token = jwt.sign({ userId: user._id, permissions: user.permissions }, secretToken, { expiresIn: '1y' });
    
    res.status(200).json({ token });

  } catch (error) {
    console.log(error);
    res.status(500).json({
        error: error.message,
    });
  }
}

const deleteUser = async (req, res) => {
  const { id } = req.body
  if (id) {
    const user = await User.findById(id)
    await createLog(`${user.email} fue eliminado.`)
    await User.findByIdAndDelete(id);
    res.status(200).send(`Se elimino el usuario con éxito.`)
  } else{
    res.status(206).send(`No id.`)
  }
}

const changeUserStatus = async (req, res) => {
  const { id } = req.body

  let newStatus = ""

  if (id) {
    try {
      const user = await User.findById(id);

      if (user.status){
        newStatus = false
        await createLog(`El usuario ${user.email} fue suspendido.`)
      } else{
        newStatus = true
        await createLog(`El usuario ${user.email} fue re-activado.`)
      }

      await User.findByIdAndUpdate(id, {
        status: newStatus,
      })
      res.status(200).send(`Se actualizo el usuario con éxito.`)
    } catch (error) {
      res.status(206).send(`Ocurrió un error inesperado.`)
    }
  } else{
    res.status(206).send(`Ocurrió un error inesperado.`)
  }
};

const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
    if (!emailPattern.test(email)) {
      res.status(400).json({ error: 'Correo electrónico invalido.' });
      return;
    }
    
    const emailInUse = await User.findOne({ email });
    if (emailInUse) {
      res.status(400).json({ error: 'Este correo electrónico se encuentra en uso.' });
    } else {
      res.status(200).json({ message: 'OK' });
    }
  } catch (error) {
    res.status(500).json(error)
  }
}

const createUser = async (req, res) => {
  const { email, password, birthdate, biography, location, name, surname, jobPosition } = req.body;
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,25}$/;
  
  if (!emailPattern.test(email)) {
    res.status(400).json({ error: 'Correo electrónico invalido.' });
    return;
  }
  
  if (!passwordPattern.test(password)) {
    res.status(400).json({ error: 'Contraseña invalida.' });
    return;
  }
  
  const emailInUse = await User.findOne({ email });
  if (emailInUse) {
    res.status(400).json({ error: 'Este correo electrónico se encuentra en uso.' });
    return;
  } 
  
  const saltRound = 13; 
  const passwordEncripted = bcrypt.hashSync(password, saltRound);

  const permissions = 'user';
  const status = true;
  const startDate = moment().format('DD/MM/YYYY');
  const totalScore = 0;
  const welcomeViewed = true;
  const TMDquestionnaireEnabled = true;
  const TMD = false;
  
  const newUser = new User({
      name,
      surname,
      email,
      password: passwordEncripted,
      venture: "Undefined",
      location,
      birthdate,
      biography,
      jobPosition,
      startDate,
      rankingPosition: "Undefined",
      totalScore,
      welcomeViewed,
      status,
      permissions,
      TMD,
      TMDquestionnaireEnabled,
      LeccionesCompletasTMD: [],
      InstruccionesCompletasTMD: [],
      FirstTMDTest: {
        date: "Undefined",
        section1: {
          question1: "",
          question1Justification: "",
          question2: "",
          question2Justification: "",
          question3: "",
          question3Justification: "",
          question4: "",
          question4Justification: "",
          question5: "",
          question5Justification: "",
          question6: "",
          question6Justification: "",
          question7: "",
          question7Justification: "",
          sectionScore: 0,
        },
        section2: {
          question8: "",
          question8Justification: "",
          question9: "",
          question10: "",
          question11: "",
          question12: "",
          sectionScore: 0,
        },
        section3: {
          question13: "",
          question14: "",
          question15: "",
          question16: "",
          question17: "",
          question18: "",
          question19: "",
          question20: "",
          question21: "",
          sectionScore: 0,
        },
        section4: {
          question22: "",
          question23: "",
          question23Justification: "",
          question56: "",
          question24: "",
          question25: "",
          question26: "",
          question57: "",
          sectionScore: 0,
        },
        section5: {
          question27: "",
          question28: "",
          question29: "",
          question30: "",
          question31: "",
          question32: "",
          question33: "",
          question34: "",
          question35: "",
          question36: "",
          question37: "",
          question38: "",
          question39: "",
          question39Justification: "",
          question40: "",
          question41: "",
          question42: "",
          question43: "",
          question43Justification: "",
          sectionScore: 0,
        },
        section6: {
          question44: "",
          question45: "",
          question46: "",
          question47: "",
          question48: "",
          question49: "",
          question49Justification: "",
          question50: "",
          question51: "",
          question52: "",
          question52Justification: "",
          question53: "",
          question53Justification: "",
          question54: "",
          question55: "",
          question55Justification: "",
          sectionScore: 0,
        },
        totalScore: "Undefined",
      },
    });
    await newUser.save();
    // await sendEmailNewUser(email)
    await createLog(`Se creo el usuario: ${email}.`)
    res.status(200).json({});
  }

const sendEmailNewUser = async ( email ) => {
  if ( email ){
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      await transporter.sendMail({
        from: '"STANNUM Game" no-reply@stannum.com.ar',
        to: email,
        subject: "¡Bienvenido a STANNUM Game!", 
        html: `
          <div style="width: 100%; text-align: center; background-color: #3A3A3A; padding: 2rem; border-bottom: 2px solid #67CCB9; background-attachment: fixed; background-repeat: no-repeat; background-blend-mode: multiply; background-image: url('https://doc-0c-90-docs.googleusercontent.com/docs/securesc/2lc7vs8d0n3e38d02dp61blmfed72min/m74lh5a2v0tudleh37urf8vp7kac8386/1685163075000/07405825733652792889/14585000474494058987/16bwV4nSFRBcfVFNuax3xlv-25LPqH-Xj?ax=ADWCPKB6LiEkrQSHog7bli8wFR9vSUvMOKrN70y6y5ycXjHfTnV5XCbioL07_IPj0phxf76l__e_Va8rVffS-Fo2I83Ij463JqM-Ta-GR2HSTBluqEEnZSLRdwJ3URrWuur0mS1YAB6nSyvlgIXJq--Bk6ipaZ9xXudCHlVfiEbSRphZhoN9fJxIDhr7C1g5LHqSyAWndKoBZ_d7OkRzJO1Nqwxrvc2F8qiInFqwi66KEkabVwESWH1g-184hY7VraTOy2QSiIz7cnkwzrWJH0TTY9SnbBNe1fa2ACFsA2SzG8xwRYd8WhNxM5ywhmhjqwR2Nji6rTgBBi27gPgJy2nJa8Ax7BsPdRMRNinwaeAlrNtrfV0xLJCUo25FnZMcGCewJJQJsaHtiAWnlOhu_96KiCDwNkdqD7tcH0_Nj8-FhjUjl4jCikzOpwmb_F6ny-vG-zm_qp3rr-Jc6gvNiz6WD6AHnyKJd_GcbZcV_3BnqVBy3eiKUTuBsMNHYM9ExUaM_TIMRTUtieL3X03woUE9ZBy-Tp_vgqDFe9CjXkzXH7080597lZjWpzgc_5wM4DTwSK_jxl1x1Q79RBnW7HgYGoeBmZV2kQ7YZdPEEJmRbdNWEb15uYpe1pHvw14dxIuUUReEiy_itJJsDonKHJ86SfVgj9ovqwL68mqrSsfBgUfTuhpY6PBJ9Bb-5XVXIYyDNGhEgMjHh5Ook-ge__SONwLb_C9TDeIkeuNyoppumh1EHW7foujYaUgek-uXP0LkS7-_ZDazjvqPL83WqTSKj9VaKPMfTNFSlK1HX51jnHcToLgO_Ukm1SOXHqpra6fF2jiA_RP7gtgg2fa7fkTm1bSXT0z_TONTjx2N9OS89k_jGdF5VSvAqxiN7fBRcFOO7Jv1X3suzLkbS3j3megwy6vuqDboDroUERvNhoCsomzJrijVsyj44ftz9Rg2b9bYXvRkoFgn9SfiFh7247Q73Hr9vdek9gZQqLvPAec4WdQjk1vVgYSCgTEr5AoOPy_2hvJIQSctFmWDZt6M_N3ZrAWXUwlre4O5DhaMfMY19-rETUgMt6kyFZPYV1eLgXnYoAWLhDbPtiOzClnyJ0GY-HWnApBvgOXmA98C3ez4QsVHqs6o4BEU351Y_WYF-3J6xMwqCticLnsTyC9PMKzA-vhHGP0I&uuid=5c02fc1e-f674-443a-a333-9d4f52f375d8&authuser=0'); background-position: center center;">
            <img src="https://drive.google.com/uc?export=download&id=1C3iscTmKW483rvuj7_vWGvBXsol3h2Tq" alt="Logo" style="width: 200px; height: auto; margin: 20px auto;">
          </div>
          <div style="width: 100%; text-align: center; background-color: #fff; padding: 2rem; padding-top: 5rem;">
            <p style="font-size: 24px; color: #3A3A3A; font-style: bold;">Bienvenido a STANNUM Game!</p>
            <p style="font-size: 16px; color: #3A3A3A;">Ingresa al sitio haciendo click en este botón:</p>
            <a href="https://stannumgamedevelopprueba.netlify.app/Login" style="margin-bottom: 5rem; display: inline-block; padding: 10px 20px; background-color: #67CCB9; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;">Ir al sitio</a>    
          </div>
          <div style="width: 100%; text-align: center; background-color: #3A3A3A; padding: 2rem; border-top: 4px solid #67CCB9;">
            <div style="width: 70%; margin: auto; text-align: center;">
              <a href="https://www.instagram.com/stannum.ar/" style="color: #fff; text-decoration: none; display: inline-block; margin-right: 1.5rem;"><img src="https://www.edigitalagency.com.au/wp-content/uploads/new-Instagram-logo-white-glyph.png" alt="Instagram Stannum" style="width:25px;"></a>
              <a href="https://www.facebook.com/stannumAR/" style="color: #fff; text-decoration: none; display: inline-block; margin-right: 1.5rem;"><img src="https://www.iconsdb.com/icons/preview/white/facebook-xxl.png" alt="Facebook Stannum" style="width:25px;"></a>
              <a href="https://www.youtube.com/@stannumacademy" style="color: #fff; text-decoration: none; display: inline-block; margin-right: 1.5rem;"><img src="http://clipart-library.com/images/dc4LABqni.png" alt="Youtube Stannum" style="width:25px;"></a>
              <a href="https://www.linkedin.com/company/stannum-academy/" style="color: #fff; text-decoration: none; display: inline-block; margin-right: 1.5rem;"><img src="https://www.freeiconspng.com/thumbs/linkedin-logo-png/displaying-19-gallery-images-for-linkedin-logo-png-25.png" alt="Linkedin Stannum" style="width:25px;"></a>
              <a href="https://www.tiktok.com/@stannum.ar" style="color: #fff; text-decoration: none; display: inline-block;"><img src="https://www.iconsdb.com/icons/preview/white/tiktok-xxl.png" alt="TikTok Stannum" style="width:25px;"></a>
            </div>            
          </div>
        `,
      });
      return
    } catch (error) {
      console.log(error.message);
    }
  }
}

const editProfileUser = async (req, res) => {
  try {
    const { id } = req.params
    const { name, surname, location, birthdate, jobPosition, biography } = req.body

    await User.findByIdAndUpdate(id, {
      name,
      surname,
      location,
      birthdate,
      jobPosition,
      biography
    })
    res.status(200).json({})
  } catch (error) {
    res.status(500).json({ error })
  }
};

const passwordRecovery = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({"email": email})
    if (user) {
      const tokenNormal = jwt.sign({ userId: user._id }, secretToken, { expiresIn: "1h" })
      const token = Buffer.from(JSON.stringify(tokenNormal)).toString('base64');
      let transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
        tls: {
            rejectUnauthorized: false
          }
      });
      let info = await transporter.sendMail({
        from: '"STANNUM Academy" no-reply@stannum.com.ar',
        to: email,
        subject: "Olvide mi contraseña", 
        html: `            
          <div style="width: 100%; text-align: center; background-color: #3A3A3A; padding: 2rem; border-bottom: 4px solid #67CCB9;">
            <img src="https://drive.google.com/uc?export=download&id=1T-hwu10IZ3_kkeyOZIhDUKISgFPAtMTk" alt="Logo" style="width: 200px; height: auto; margin: 20px auto;">
          </div>
          <div style="width: 100%; text-align: center; background-color: #DEDEDE; padding: 2rem; padding-top: 5rem;">
            <p style="font-size: 20px; color: #3A3A3A;">Se ha generado un enlace para que puedas restaurar tu contraseña en STANNUM Academy.</p>
            <p style="font-size: 16px; color: #3A3A3A;">Hacé click en el botón de abajo para ir al enlace.</p>
            <a href="https://pruebastannumacademyinterna.netlify.app/Recuperar-contrase%C3%B1a/Nueva-contrase%C3%B1a/${token}" style="margin-bottom: 5rem; display: inline-block; padding: 10px 20px; background-color: #67CCB9; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;">Ir al sitio</a>    
          </div>
          <div style="width: 100%; text-align: center; background-color: #3A3A3A; padding: 2rem; border-top: 4px solid #67CCB9;">
            <div style="width: 70%; margin: auto; text-align: center;">
              <a href="https://www.instagram.com/stannum.ar/" style="color: #fff; text-decoration: none; display: inline-block; margin-right: 1.5rem;"><img src="https://www.edigitalagency.com.au/wp-content/uploads/new-Instagram-logo-white-glyph.png" alt="Instagram Stannum" style="width:25px;"></a>
              <a href="https://www.facebook.com/stannumAR/" style="color: #fff; text-decoration: none; display: inline-block; margin-right: 1.5rem;"><img src="https://www.iconsdb.com/icons/preview/white/facebook-xxl.png" alt="Facebook Stannum" style="width:25px;"></a>
              <a href="https://www.youtube.com/@stannumacademy" style="color: #fff; text-decoration: none; display: inline-block; margin-right: 1.5rem;"><img src="http://clipart-library.com/images/dc4LABqni.png" alt="Youtube Stannum" style="width:25px;"></a>
              <a href="https://www.linkedin.com/company/stannum-academy/" style="color: #fff; text-decoration: none; display: inline-block; margin-right: 1.5rem;"><img src="https://www.freeiconspng.com/thumbs/linkedin-logo-png/displaying-19-gallery-images-for-linkedin-logo-png-25.png" alt="Linkedin Stannum" style="width:25px;"></a>
              <a href="https://www.tiktok.com/@stannum.ar" style="color: #fff; text-decoration: none; display: inline-block;"><img src="https://www.iconsdb.com/icons/preview/white/tiktok-xxl.png" alt="TikTok Stannum" style="width:25px;"></a>
            </div>            
          </div>
        `,
      });
      res.status(200).json("El correo se envió con éxito.");
    } else {
      res.status(206).send({ message: 'Usuario no encontrado' })
  }
  } catch (error) {
    console.log(error);
    res.status(206).json({ message: "Ocurrió un error inesperado." });
  }
};

const changePassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const decodedToken = JSON.parse(Buffer.from(token, 'base64').toString());
    const { userId } = jwt.verify(decodedToken, secretToken);

    const saltRound = 13; 
    const passwordEncripted = bcrypt.hashSync(password, saltRound);

    await User.findByIdAndUpdate(userId, { 
      password: passwordEncripted
    });
    res.status(200).json('La contraseña se cambio con éxito.');
  } catch (error) {
    console.log(error);
    if (error.name === 'JsonWebTokenError') {
      res.status(206).json({ message: 'El enlace es invalido.' });
    } else if (error.name === 'TokenExpiredError') {
      res.status(206).json({ message: 'El enlace expiró' });
    } else {
      res.status(206).json({ message: 'Error del servidor' });
    }
  }
};

module.exports = { createUser, checkEmailExists, getUser, deleteUser, editProfileUser, getUserEspecifico, getUserEspecificoId, loginUser, passwordRecovery, changePassword, changeUserStatus, searchResults, getRankingTMD }