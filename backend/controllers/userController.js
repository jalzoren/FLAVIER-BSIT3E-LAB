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

    let profileImageUrl = "/WONN.jpg";
    
    if (userDetails?.profile_image_path) {
      try {
        const { data: publicUrl } = supabase
          .storage
          .from('profiles')
          .getPublicUrl(userDetails.profile_image_path);
        
        profileImageUrl = publicUrl.publicUrl;
      } catch (err) {
        console.error("Error getting image URL:", err);
        profileImageUrl = userDetails?.profile_image || "/WONN.jpg";
      }
    } else if (userDetails?.profile_image) {
      profileImageUrl = userDetails.profile_image;
    }

    res.json({
      name: userDetails?.name || username,
      dateOfIssue: userDetails?.date_of_issue || "2026-03-20",
      location: userDetails?.location || "BSIT3E",
      whatILike: userDetails?.what_i_like || "COFFEE",
      memberOf: userDetails?.member_of || "정보기술\nInformation Technology",
      profileImage: profileImageUrl
    });
    
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};