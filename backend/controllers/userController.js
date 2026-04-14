const supabase = require('../config/supabase');

exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Fetching user data for: ${username}`);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username)
      .single();

    if (userError || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { data: userDetails, error: detailsError } = await supabase
      .from('user_details')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (detailsError && !userDetails) {
      // Return default details if not found
      return res.json({
        name: username,
        dateOfIssue: "2026-03-20",
        location: "BSIT3E",
        whatILike: "COFFEE",
        memberOf: "정보기술\nInformation Technology",
        profileImage: "/WONN.jpg"
      });
    }

    res.json({
      name: userDetails?.name || username,
      dateOfIssue: userDetails?.date_of_issue,
      location: userDetails?.location,
      whatILike: userDetails?.what_i_like,
      memberOf: userDetails?.member_of,
      profileImage: userDetails?.profile_image
    });
    
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};