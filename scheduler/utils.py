def has_conflict(section1, section2):
    common_days = set(section1.days).intersection(section2.days)
    if not common_days:
        return False
    return (
        section1.start_time < section2.end_time and
        section2.start_time < section1.end_time
    )