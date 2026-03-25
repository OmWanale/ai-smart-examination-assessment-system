const Lecture = require("../models/Lecture");
const Class = require("../models/Class");
const asyncHandler = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");

const JAAS_APP_ID = process.env.JAAS_APP_ID;
const JAAS_KID = process.env.JAAS_KID;

const getJaasPrivateKey = () => {
  const key = process.env.JAAS_PRIVATE_KEY;
  if (!key) return null;
  return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
};

/**
 * @route   POST /api/lectures/create
 * @desc    Create a new lecture (instant or scheduled)
 * @access  Private/Teacher
 */
const createLecture = asyncHandler(async (req, res) => {
  const { classId, title, scheduledAt, isPublic } = req.body;

  if (!classId || !title || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "classId and title are required",
    });
  }

  // Verify the class exists and the user is the teacher
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    return res.status(404).json({
      success: false,
      message: "Class not found",
    });
  }

  if (classDoc.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Only the class teacher can create lectures",
    });
  }

  const roomId = `ClassynAI-${classId}-${Date.now()}`;
  const isInstant = !scheduledAt;

  const lecture = await Lecture.create({
    classId,
    teacherId: req.user._id,
    title: title.trim(),
    roomId,
    isLive: isInstant,
    status: isInstant ? "LIVE" : "UPCOMING",
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    isPublic: isPublic !== undefined ? isPublic : true,
  });

  res.status(201).json({
    success: true,
    message: isInstant
      ? "Live lecture started successfully"
      : "Lecture scheduled successfully",
    data: {
      lecture,
      joinLink: `/lecture/${roomId}`,
    },
  });
});

/**
 * @route   GET /api/classes/:classId/lectures
 * @desc    Get all lectures for a class
 * @access  Private (teacher or enrolled student)
 */
const getClassLectures = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  // Verify the class exists and user has access
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    return res.status(404).json({
      success: false,
      message: "Class not found",
    });
  }

  const isTeacher = classDoc.teacher.toString() === req.user._id.toString();
  const isStudent = classDoc.students.some(
    (s) => s.toString() === req.user._id.toString()
  );

  if (!isTeacher && !isStudent) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You are not a member of this class.",
    });
  }

  const lectures = await Lecture.find({ classId })
    .populate("teacherId", "name email")
    .sort({ createdAt: -1 });

  const now = new Date();
  const live = [];
  const upcoming = [];
  const past = [];

  lectures.forEach((lec) => {
    if (lec.status === "LIVE" || lec.isLive) {
      live.push(lec);
    } else if (lec.status === "ENDED") {
      past.push(lec);
    } else if (lec.scheduledAt && new Date(lec.scheduledAt) > now) {
      upcoming.push(lec);
    } else {
      past.push(lec);
    }
  });

  res.json({
    success: true,
    data: { live, upcoming, past, all: lectures },
  });
});

/**
 * @route   POST /api/lectures/:id/start
 * @desc    Mark a scheduled lecture as live
 * @access  Private/Teacher
 */
const startLecture = asyncHandler(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);

  if (!lecture) {
    return res.status(404).json({
      success: false,
      message: "Lecture not found",
    });
  }

  if (lecture.teacherId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Only the lecture creator can start this lecture",
    });
  }

  lecture.isLive = true;
  lecture.status = "LIVE";
  await lecture.save();

  res.json({
    success: true,
    message: "Lecture is now live",
    data: { lecture },
  });
});

/**
 * @route   POST /api/lectures/:id/end
 * @desc    End a live lecture
 * @access  Private/Teacher
 */
const endLecture = asyncHandler(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);

  if (!lecture) {
    return res.status(404).json({
      success: false,
      message: "Lecture not found",
    });
  }

  if (lecture.teacherId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Only the lecture creator can end this lecture",
    });
  }

  lecture.isLive = false;
  lecture.status = "ENDED";
  await lecture.save();

  res.json({
    success: true,
    message: "Lecture ended",
    data: { lecture },
  });
});

/**
 * @route   GET /api/lectures/:roomId/token
 * @desc    Generate JaaS JWT for lecture join (teacher=moderator)
 * @access  Private (teacher or enrolled student)
 */
const getLectureToken = asyncHandler(async (req, res) => {
  if (!JAAS_APP_ID || !JAAS_KID || !process.env.JAAS_PRIVATE_KEY) {
    return res.status(500).json({
      success: false,
      message: "JaaS token generation is not configured on server",
    });
  }

  const roomId = req.params.roomId || req.query.roomId || req.body?.roomId;
  console.log("[LECTURE TOKEN] hit", req.method, req.originalUrl, "roomId:", roomId);
  if (!roomId) {
    return res.status(400).json({
      success: false,
      message: "roomId is required",
    });
  }
  const lecture = await Lecture.findOne({ roomId });
  if (!lecture) {
    console.warn("[LECTURE TOKEN] denied: lecture not found", {
      userId: String(req.user?._id),
      roomId,
    });
    return res.status(404).json({
      success: false,
      message: "Lecture not found",
    });
  }

  const routeClassId = req.params.classId;
  if (routeClassId && lecture.classId.toString() !== routeClassId) {
    console.warn("[LECTURE TOKEN] denied: class/lecture mismatch", {
      userId: String(req.user?._id),
      roomId,
      routeClassId,
      lectureClassId: String(lecture.classId),
    });
    return res.status(403).json({
      success: false,
      message: "Access denied for this class lecture.",
    });
  }

  const classDoc = await Class.findById(lecture.classId);
  if (!classDoc) {
    return res.status(404).json({
      success: false,
      message: "Class not found",
    });
  }

  const isClassTeacher = classDoc.teacher.toString() === req.user._id.toString();
  const isStudent = classDoc.students.some(
    (s) => s.toString() === req.user._id.toString()
  );

  if (!isClassTeacher && !isStudent) {
    console.warn("[LECTURE TOKEN] denied: requester not class member", {
      userId: String(req.user?._id),
      roomId,
      classId: String(classDoc._id),
    });
    return res.status(403).json({
      success: false,
      message: "Access denied. You are not a member of this class.",
    });
  }

  if (
    lecture.teacherId &&
    classDoc.teacher &&
    lecture.teacherId.toString() !== classDoc.teacher.toString()
  ) {
    console.warn("[LECTURE TOKEN] denied: lecture teacher mismatch", {
      roomId,
      classId: String(classDoc._id),
      lectureTeacherId: String(lecture.teacherId),
      classTeacherId: String(classDoc.teacher),
    });
    return res.status(403).json({
      success: false,
      message: "Lecture ownership validation failed.",
    });
  }

  // JAAS expects the key id to be prefixed with the app id (appId/keyId) and
  // moderator to be provided as a string flag for role resolution.
  const jaasKeyId = JAAS_KID.includes("/") ? JAAS_KID : `${JAAS_APP_ID}/${JAAS_KID}`;

  let token;
  try {
    token = jwt.sign(
      {
        aud: "jitsi",
        iss: "chat",
        sub: JAAS_APP_ID,
        room: roomId,
        context: {
          user: {
            id: String(req.user._id),
            name: req.user.name || req.user.email || "User",
            email: req.user.email || "",
            moderator: isClassTeacher ? "true" : "false",
          },
        },
      },
      getJaasPrivateKey(),
      {
        algorithm: "RS256",
        keyid: jaasKeyId,
        expiresIn: "1h",
      }
    );
  } catch (error) {
    console.error("[LECTURE TOKEN] token generation failed", {
      roomId,
      userId: String(req.user?._id),
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to generate JaaS token. Check JAAS_APP_ID, JAAS_KID, and JAAS_PRIVATE_KEY configuration.",
    });
  }

  res.json({
    success: true,
    data: {
      token,
      moderator: isClassTeacher,
      appId: JAAS_APP_ID,
    },
  });
});

module.exports = {
  createLecture,
  getClassLectures,
  startLecture,
  endLecture,
  getLectureToken,
};
