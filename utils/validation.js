export function validateEditProfileData(req) {
  const allowedProps = ["name", "age"];

  const isValid = Object.keys(req.body).every((val) =>
    allowedProps.includes(val)
  );
  return isValid;
}

export function validateForgetpasswordData(res, req) {
  const allowedProps = ["email", "password"];

  const isValid = Object.keys(req.body).every((val) =>
    allowedProps.includes(val)
  );

  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid Payload",
    });
  }

  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Invalid Credentials",
    });
  }

  if (req.body.password.length < 4) {
    return res.status(400).json({
      success: false,
      message: "Password should contains more than 4 characters",
    });
  }
}
