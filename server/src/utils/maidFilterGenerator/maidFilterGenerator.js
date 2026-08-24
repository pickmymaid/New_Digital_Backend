
const maidFilterGenerator = (filter) => {
    const option = filter?.option;
    const location = filter?.location;
    const skills = filter?.skills;
    let availability = filter?.availability;
    let salary = filter?.salary;
    const nationality = filter?.nationality;
    const ageFrom = filter?.ageFrom;
    const ageTo=filter?.ageTo
    const service = filter?.service
    const visa = filter?.visa
    const religion = filter?.religion
    const searchParams = filter?.searchParams
    let primaryService = null;

    if(salary && salary?.[0] !== 'negotiable'){
        salary = salaryQueryGenerator(salary);
    }

    const pipeline = {
        age: {
            $gte: 0,
            $lte: 100
        }
    };

    if (option?.[0]) {
        pipeline.option = opINReturn(option)
    }
    if (location) {
        pipeline.location = location
    }
    if (availability?.[0]) {
        availability = availability?.map((item) => item === "Hired" ? false : true)
        pipeline.availability = opINReturn(availability);
    }
    if (skills?.[0]) {
        pipeline.skills = opINReturn(skills);
    }

    if(salary?.[0] === 'negotiable'){
        pipeline.is_negotiable_salary = true
    }else if(salary){
        pipeline['$or'] = [...(pipeline.$or || []), ...salary];
    }

    if(nationality){
        pipeline.nationality = opINReturn(nationality)
    }
    if(ageFrom){
        pipeline.age['$gte'] = ageFrom
    }
    if(ageTo){
        pipeline.age['$lte'] = ageTo
    }
    if(service){
        if(service.includes('Cook')){
            pipeline['$or'] = [...(pipeline.$or || []), {service: {$in: service}}, {skills: {$in : ['Cook', 'Cooking']}}]
        } else if (service.length === 1 && service[0] === 'Maid') {
            pipeline.service = opINReturn(['Maid', 'Nanny']);
            primaryService = 'Maid';
        } else if (service.length === 1 && service[0] === 'Nanny') {
            pipeline.service = opINReturn(['Nanny', 'Maid']);
            primaryService = 'Nanny';
        } else {
            pipeline.service = opINReturn(service)
        }
    }
    if(visa){
        pipeline.visa_status = opINReturn(visa)
    }
    if(religion){
        pipeline.religion = opINReturn(religion)
    }

    if(searchParams){
        const searchTerms = searchParams.split(' ').map((term) => term.trim());
        const searchOrConditions = searchTerms.map((term) => ({
            $or: [
                { skills: { $regex: term, $options: 'i' } },
                { name: { $regex: term, $options: 'i' } },
                { "language.name": { $regex: term, $options: 'i' } },
                { option: { $regex: term, $options: 'i' } },
                { notes: { $regex: term, $options: 'i' } },
                { current_location: { $regex: term, $options: 'i' } },
                { service: { $regex: term, $options: 'i' } },
                { "visa status": { $regex: term, $options: 'i' } },
                { religion: { $regex: term, $options: 'i' } },
                { location: { $regex: term, $options: 'i' } },
                { nationality: { $regex: term, $options: 'i' } },
                { marital_status: { $regex: term, $options: 'i' } }
            ]
        }));
        pipeline.$or = [...(pipeline.$or || []) , ...searchOrConditions];
    }


    return { filter: pipeline, primaryService };

}

const salaryQueryGenerator = (salaryRanges) => {
    const salaryQueries = [];

    salaryRanges.forEach((range) => {
        const [minSalary, maxSalary] = range.split('-').map(Number);
        salaryQueries.push({
            $and: [
                { 'salary.from': { $gte: minSalary } },
                { 'salary.to': { $lte: maxSalary } },
            ],
        });
    });


    return salaryQueries;
}

const opINReturn = (value) => ({ $in: value })

module.exports = { maidFilterGenerator };
