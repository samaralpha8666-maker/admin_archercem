export const getInstitutionType = () => {
    // We can get it directly from localStorage if stored separately,
    // or parse the kt-auth-react-v object.
    const lsValue = localStorage.getItem('kt-auth-react-v');
    if (lsValue) {
        try {
            const auth = JSON.parse(lsValue);
            return auth?.user?.institution_type || 'SCHOOL';
        } catch (error) {
            return 'SCHOOL';
        }
    }
    return 'SCHOOL';
}

export const getAcademicLabel = () => {
    const type = getInstitutionType();
    if (type === 'COACHING') return 'Batch';
    return type === 'COLLEGE' ? 'Course' : 'Class';
}

export const getPluralAcademicLabel = () => {
    const type = getInstitutionType();
    if (type === 'COACHING') return 'Batches';
    return getAcademicLabel() === 'Course' ? 'Courses' : 'Classes';
}

export const getDepartmentLabel = () => {
    const type = getInstitutionType();
    return type === 'COLLEGE' ? 'Department' : null;
}

export const getTeacherLabel = () => {
    const type = getInstitutionType();
    if (type === 'COLLEGE') return 'Advisor/Mentor';
    if (type === 'COACHING') return 'Instructor';
    return 'Class Teacher';
}

export const getTeacherLabelPlural = () => {
    const type = getInstitutionType();
    if (type === 'COLLEGE') return 'Faculties';
    if (type === 'COACHING') return 'Instructors';
    return 'Teachers';
}

export const getTeacherMappingLabel = () => {
    const type = getInstitutionType();
    if (type === 'COLLEGE') return 'Faculty Allocation';
    if (type === 'COACHING') return 'Instructor Mapping';
    return 'Teacher Mapping';
}

export const getRollNumberLabel = () => {
    const type = getInstitutionType();
    if (type === 'COLLEGE') return 'Enrollment No';
    if (type === 'COACHING') return 'Reg No';
    return 'Roll Number';
}

export const getInstitutionLabel = () => {
    const type = getInstitutionType();
    if (type === 'COLLEGE') return 'College';
    if (type === 'COACHING') return 'Coaching';
    return 'School';
}

export const getPaginationRange = (currentPage: number, totalPages: number) => {
  const range: (number | string)[] = [];
  const delta = 1; // how many pages to show around current page (1 is standard for compact, 2 for wider)

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    } else if (range[range.length - 1] !== '...') {
      range.push('...');
    }
  }
  return range;
};

