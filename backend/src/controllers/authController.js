const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { role, name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User Alraedy Exists." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      role,
      name,
      email,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).json({ message: "user registered successfully." });

  } catch(error) {
    console.log(error);
    console.error("error:---",error.message);
    res.status(500).json({message: "Server Error"});
  }
};

exports.login = async (req, res) =>{
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({message:"Invalid Credential"});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({message:"Invalid Credential"});

        const token = jwt.sign(
            {id:user._id, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: "1d"}
        );
        res.json({
            token,
            user:{
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.log("error:--", error);
        console.error(error);
        res.status(500).json({message:"Server Error"})
    }
}
