function hh(n){ return n; }
dh=lh=ch=Yt=$t=tn=Tn=en=tn=nn=on=rn=an=sn=cn=un=ln=pn=dn=fn=hn=hh;
yn=mn=bn=gn=vn=Sn=wn=An=Cn=In=kn=Mn=Pn=Rn=Tn=Bn=En=xn=Ln=On=hh;


function parseProfileData(e) {
    if (null === e)
        return null;
    if (!(e instanceof Array))
        throw new Error;
    for (var t = {}, n = 0; n < e.length; n++)
        switch (n) {
        case 0:
            t.Id = dh(e[n]);
            break;
        case 1:
            t.CurrentActionPoints = dh(e[n]);
            break;
        case 2:
            t.ActionPointsRestoredAt = hh(e[n]);
            break;
        case 3:
            t.IsAdult = lh(e[n]);
            break;
        case 4:
            t.Money = dh(e[n]);
            break;
        case 5:
            t.Gem = dh(e[n]);
            break;
        case 6:
            t.FreeGem = dh(e[n]);
            break;
        case 7:
            t.Level = dh(e[n]);
            break;
        case 8:
            t.TotalExperience = dh(e[n]);
            break;
        case 9:
            t.MaxActionPoints = dh(e[n]);
            break;
        case 10:
            t.TotalFieldSkillCost = dh(e[n]);
            break;
        case 11:
            t.DisplayUserId = ch(e[n])
        }
    return t;
}

function parseStatusData(e) {
    if (null === e)
        return null;
    if (!(e instanceof Array)){
        throw new Error;
    }
    for (var t = {}, n = 0; n < e.length; n++)
        switch (n) {
        case 0:
            t.HP = dh(e[n]);
            break;
        case 1:
            t.Strength = dh(e[n]);
            break;
        case 2:
            t.Defence = dh(e[n]);
            break;
        case 3:
            t.Dexterity = dh(e[n]);
            break;
        case 4:
            t.Speed = dh(e[n]);
            break;
        case 5:
            t.Intelligence = dh(e[n]);
            break;
        case 6:
            t.MindDefence = dh(e[n]);
            break;
        case 7:
            t.Mind = dh(e[n]);
            break;
        case 8:
            t.Luck = dh(e[n])
        }
    return t
}

function parseSkillData(e) {
    if (null === e)
        return null;
    if (!(e instanceof Array))
        throw new Error;
    for (var t = {}, n = 0; n < e.length; n++)
        switch (n) {
        case 0:
            t.Id = dh(e[n]);
            break;
        case 1:
            t.MSkillId = dh(e[n]);
            break;
        case 2:
            t.Stage = dh(e[n]);
            break;
        case 3:
            t.Rank = dh(e[n]);
            break;
        case 4:
            t.Learned = lh(e[n])
        }
    return t
}

function parseUserPreference(e) {
    if (null === e)
        return null;
    if (!(e instanceof Array))
        throw new Error;
    for (var t = {}, n = 0; n < e.length; n++)
        switch (n) {
        case 0:
            t.Name = ch(e[n]);
            break;
        case 1:
            t.DateOfBirth = hh(e[n]);
            break;
        case 2:
            t.LocateType = Yt(e[n]);
            break;
        case 3:
            t.WeaponLimit = dh(e[n]);
            break;
        case 4:
            t.ArmorLimit = dh(e[n]);
            break;
        case 5:
            t.AccessoryLimit = dh(e[n]);
            break;
        case 6:
            t.AbilityStoneLimit = dh(e[n]);
            break;
        case 7:
            t.SoundMute = lh(e[n]);
            break;
        case 8:
            t.BgmVolume = dh(e[n]);
            break;
        case 9:
            t.SeVolume = dh(e[n]);
            break;
        case 10:
            t.VoiceVolume = dh(e[n]);
            break;
        case 11:
            t.MyPageBgmJukeBoxActivated = lh(e[n]);
            break;
        case 12:
            t.AutoRoundBgmJukeBoxActivated = lh(e[n]);
            break;
        case 13:
            t.UJukeBoxMusicSettingViewModel = parseJukeBox(e[n]);
            break;
        case 14:
            t.CharacterAutoLockRarity = dh(e[n]);
            break;
        case 15:
            t.IsHomeCharacterRandom = lh(e[n]);
            break;
        case 16:
            t.CurrentHomeViewTypeIsCharacter = lh(e[n]);
            break;
        case 17:
            t.MFieldSkillId1 = dh(e[n]);
            break;
        case 18:
            t.MFieldSkillId2 = dh(e[n]);
            break;
        case 19:
            t.MFieldSkillId3 = dh(e[n]);
            break;
        case 20:
            t.IsHomeFieldSkillRandom = lh(e[n]);
            break;
        case 21:
            t.KnuckleWeaponLevel = dh(e[n]);
            break;
        case 22:
            t.KnuckleWeaponTotalPoint = dh(e[n]);
            break;
        case 23:
            t.SwordWeaponLevel = dh(e[n]);
            break;
        case 24:
            t.SwordWeaponTotalPoint = dh(e[n]);
            break;
        case 25:
            t.AxWeaponLevel = dh(e[n]);
            break;
        case 26:
            t.AxWeaponTotalPoint = dh(e[n]);
            break;
        case 27:
            t.SpearWeaponLevel = dh(e[n]);
            break;
        case 28:
            t.SpearWeaponTotalPoint = dh(e[n]);
            break;
        case 29:
            t.WhipWeaponLevel = dh(e[n]);
            break;
        case 30:
            t.WhipWeaponTotalPoint = dh(e[n]);
            break;
        case 31:
            t.MagicWeaponLevel = dh(e[n]);
            break;
        case 32:
            t.MagicWeaponTotalPoint = dh(e[n]);
            break;
        case 33:
            t.BowWeaponLevel = dh(e[n]);
            break;
        case 34:
            t.BowWeaponTotalPoint = dh(e[n]);
            break;
        case 35:
            t.RodWeaponLevel = dh(e[n]);
            break;
        case 36:
            t.RodWeaponTotalPoint = dh(e[n]);
            break;
        case 37:
            t.GunWeaponLevel = dh(e[n]);
            break;
        case 38:
            t.GunWeaponTotalPoint = dh(e[n]);
            break;
        case 39:
            t.UPartyId = dh(e[n]);
            break;
        case 40:
            t.MQuestId = dh(e[n]);
            break;
        case 41:
            t.BattleAutoSetting = $t(e[n]);
            break;
        case 42:
            t.BattleSpeed = tn(e[n]);
            break;
        case 43:
            t.AutoSellEquipRarity = on(e[n]);
            break;
        case 44:
            t.AutoSellEquipEvolution = an(e[n]);
            break;
        case 45:
            t.AutoSellEquipLevel = cn(e[n]);
            break;
        case 46:
            t.AutoSellAbility = ln(e[n]);
            break;
        case 47:
            t.AutoSellSlot = dn(e[n]);
            break;
        case 48:
            t.AdventureTextFeed = hn(e[n]);
            break;
        case 49:
            t.SpecialSkillAnimation = mn(e[n]);
            break;
        case 50:
            t.CurrentClearChapter = dh(e[n]);
            break;
        case 51:
            t.UnlockFeatureFlag = gn(e[n]);
            break;
        case 52:
            t.UnlockEffectFlag = gn(e[n]);
            break;
        case 53:
            t.FunctionHelpFlag = vn(e[n]);
            break;
        case 54:
            t.FunctionHelpFlag2 = Sn(e[n]);
            break;
        case 55:
            t.FunctionHelpFlag3 = wn(e[n]);
            break;
        case 56:
            t.TutorialStatus = An(e[n]);
            break;
        case 57:
            t.BattleAutoSellEquipType = Cn(e[n]);
            break;
        case 58:
            t.BattleRaritySellTypeB = kn(e[n]);
            break;
        case 59:
            t.BattleRaritySellTypeA = kn(e[n]);
            break;
        case 60:
            t.BattleRaritySellTypeS = kn(e[n]);
            break;
        case 61:
            t.AbilityStoneBattleRaritySellTypeA = kn(e[n]);
            break;
        case 62:
            t.AbilityStoneBattleRaritySellTypeS = kn(e[n]);
            break;
        case 63:
            t.InCombat = lh(e[n]);
            break;
        case 64:
            t.WorkOutEndTime = hh(e[n]);
            break;
        case 65:
            t.DoubleWorkOutEndTime = hh(e[n]);
            break;
        case 66:
            t.HasRecommendNotice = lh(e[n]);
            break;
        case 67:
            t.IsAutoSpecialSkill = lh(e[n]);
            break;
        case 68:
            t.IsAutoOverDrive = lh(e[n]);
            break;
        case 69:
            t.EnableConnect = lh(e[n]);
            break;
        case 70:
            t.EnableIndividualAutoSell = lh(e[n]);
            break;
        case 71:
            t.ImageQualitySetting = Pn(e[n]);
            break;
        case 72:
            t.RankingTitleId = dh(e[n]);
            break;
        case 73:
            t.IsAutoApprovalFriendRequest = lh(e[n]);
            break;
        case 74:
            t.EnableEnemyShieldEffect = lh(e[n]);
            break;
        case 75:
            t.BattleAutoSpecialSkillType = Tn(e[n]);
            break;
        case 76:
            t.BattleSkipBuffEffectFlag = En(e[n]);
            break;
        case 77:
            t.UserPreferenceActiveFlag = Ln(e[n]);
            break;
        case 78:
            t.CurrentClearSideStoryChapter = dh(e[n])
        }
    return t
}

function parseJukeBox(e) {
    if (null === e)
        return null;
    if (!(e instanceof Array))
        throw new Error;
    for (var t = {}, n = 0; n < e.length; n++)
        switch (n) {
        case 0:
            t.MyPageMusicId = dh(e[n]);
            break;
        case 1:
            t.AutoRoundMusicId = dh(e[n])
        }
    return t
}

function parseUCharacterBase(e) {
    if (null === e)
        return null;
    if (!(e instanceof Array))
        throw new Error;
    for (var t = {}, n = 0; n < e.length; n++)
        switch (n) {
        case 0:
            t.Id = dh(e[n]);
            break;
        case 1:
            t.UUserId = dh(e[n]);
            break;
        case 2:
            t.MCharacterBaseId = dh(e[n]);
            break;
        case 3:
            t.Experience = dh(e[n]);
            break;
        case 4:
            t.Status = parseStatusData(e[n]);
            break;
        case 5:
            t.ExStatus = parseStatusData(e[n])
        }
    return t
}

function parseUCharacter(e) {
    if (null === e)
        return null;
    if (!(e instanceof Array))
        throw new Error;
    for (var t = {}, n = 0; n < e.length; n++)
        switch (n) {
        case 0:
            t.Id = dh(e[n]);
            break;
        case 1:
            t.UUserId = dh(e[n]);
            break;
        case 2:
            t.MCharacterId = dh(e[n]);
            break;
        case 3:
            t.UCharacterBaseId = dh(e[n]);
            break;
        case 4:
            t.UCharacterBaseViewModel = parseUCharacterBase(e[n]);
            break;
        case 5:
            t.Level = dh(e[n]);
            break;
        case 6:
            t.TotalExperience = dh(e[n]);
            break;
        case 7:
            t.MaxLevel = dh(e[n]);
            break;
        case 8:
            t.USkill1 = parseSkillData(e[n]);
            break;
        case 9:
            t.USkill2 = parseSkillData(e[n]);
            break;
        case 10:
            t.USkill3 = parseSkillData(e[n]);
            break;
        case 11:
            t.SpecialSkill = parseSkillData(e[n]);
            break;
        case 12:
            t.BaseStatus = parseStatusData(e[n]);
            break;
        case 13:
            t.TotalStatus = dh(e[n]);
            break;
        case 14:
            t.KizunaRank = dh(e[n]);
            break;
        case 15:
            t.ReferenceCounting = dh(e[n]);
            break;
        case 16:
            t.GearLevel = dh(e[n]);
            break;
        case 17:
            t.TotalGearExperience = dh(e[n]);
            break;
        case 18:
            t.CanLevelup = lh(e[n]);
            break;
        case 19:
            t.IllustMCharacterId = dh(e[n]);
            break;
        case 20:
            t.IllustMCharacterSkinId = dh(e[n]);
            break;
        case 21:
            t.SdMCharacterId = dh(e[n]);
            break;
        case 22:
            t.SdMCharacterSkinId = dh(e[n]);
            break;
        case 23:
            t.UTrainBoard = parseTrainBoardMeta(e[n])
        }
    return t
}

function parseTrainBoardMeta(e) {
    if (null === e)
        return null;
    if (!(e instanceof Array))
        throw new Error;
    for (var t = {}, n = 0; n < e.length; n++)
        switch (n) {
        case 0:
            t.BoardOrder = dh(e[n]);
            break;
        case 1:
            t.DetailOrder = dh(e[n])
        }
    return t
}