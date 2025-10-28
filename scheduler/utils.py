def has_conflict(section1, section2):
    if section1.days != section2.days:
        return False
    return (
        section1.start_time < section2.end_time
        and section2.start_time < section1.end_time
    )