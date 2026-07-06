// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OrganDonation {
    enum OrganType { Heart, Liver, Kidney, Lungs, Pancreas, Intestines }
    enum BloodType { O_Neg, O_Pos, A_Neg, A_Pos, B_Neg, B_Pos, AB_Neg, AB_Pos }

    struct Patient {
        uint256 id;
        address patientAddress;
        string name;
        string nationalId;
        OrganType neededOrgan;
        BloodType bloodType;
        uint256 urgencyScore;
        uint256 timestamp;
        bool isMatched;
        uint256 matchedDonorId;
    }

    struct Donor {
        uint256 id;
        address donorAddress;
        string name;
        OrganType donatedOrgan;
        BloodType bloodType;
        uint256 timestamp;
        bool isMatched;
        uint256 matchedPatientId;
    }

    uint256 public patientCount = 0;
    uint256 public donorCount = 0;

    mapping(uint256 => Patient) public patients;
    mapping(uint256 => Donor) public donors;
    mapping(string => bool) public registeredPatientIds;
    
    uint256[] public patientIds;
    uint256[] public donorIds;

    event PatientAdded(uint256 indexed id, address indexed patientAddress, string name, string nationalId, OrganType neededOrgan, BloodType bloodType, uint256 urgencyScore);
    event DonorRegistered(uint256 indexed id, address indexed donorAddress, string name, OrganType donatedOrgan, BloodType bloodType);
    event MatchFound(uint256 indexed patientId, uint256 indexed donorId, OrganType organ, BloodType patientBloodType, BloodType donorBloodType);

    function addPatient(string memory _nationalId, string memory _name, OrganType _neededOrgan, BloodType _bloodType, uint256 _urgencyScore) public {
        require(!registeredPatientIds[_nationalId], "Patient ID already registered");
        
        patientCount++;
        patients[patientCount] = Patient({
            id: patientCount,
            patientAddress: msg.sender,
            name: _name,
            nationalId: _nationalId,
            neededOrgan: _neededOrgan,
            bloodType: _bloodType,
            urgencyScore: _urgencyScore,
            timestamp: block.timestamp,
            isMatched: false,
            matchedDonorId: 0
        });
        registeredPatientIds[_nationalId] = true;
        patientIds.push(patientCount);

        emit PatientAdded(patientCount, msg.sender, _name, _nationalId, _neededOrgan, _bloodType, _urgencyScore);
        
        _tryMatchPatient(patientCount);
    }

    function registerDonor(string memory _name, OrganType _donatedOrgan, BloodType _bloodType) public {
        donorCount++;
        donors[donorCount] = Donor({
            id: donorCount,
            donorAddress: msg.sender,
            name: _name,
            donatedOrgan: _donatedOrgan,
            bloodType: _bloodType,
            timestamp: block.timestamp,
            isMatched: false,
            matchedPatientId: 0
        });
        donorIds.push(donorCount);

        emit DonorRegistered(donorCount, msg.sender, _name, _donatedOrgan, _bloodType);

        _tryMatchDonor(donorCount);
    }

    function _tryMatchPatient(uint256 _patientId) internal {
        Patient storage patient = patients[_patientId];
        if (patient.isMatched) return;

        for (uint256 i = 0; i < donorIds.length; i++) {
            uint256 dId = donorIds[i];
            Donor storage donor = donors[dId];

            if (!donor.isMatched && donor.donatedOrgan == patient.neededOrgan && _isBloodCompatible(donor.bloodType, patient.bloodType)) {
                patient.isMatched = true;
                patient.matchedDonorId = donor.id;
                
                donor.isMatched = true;
                donor.matchedPatientId = patient.id;

                emit MatchFound(patient.id, donor.id, patient.neededOrgan, patient.bloodType, donor.bloodType);
                break;
            }
        }
    }

    function _tryMatchDonor(uint256 _donorId) internal {
        Donor storage donor = donors[_donorId];
        if (donor.isMatched) return;

        uint256 bestPatientId = 0;
        uint256 highestUrgency = 0;

        for (uint256 i = 0; i < patientIds.length; i++) {
            uint256 pId = patientIds[i];
            Patient storage patient = patients[pId];

            if (!patient.isMatched && donor.donatedOrgan == patient.neededOrgan && _isBloodCompatible(donor.bloodType, patient.bloodType)) {
                if (bestPatientId == 0 || patient.urgencyScore > highestUrgency) {
                    bestPatientId = pId;
                    highestUrgency = patient.urgencyScore;
                }
            }
        }

        if (bestPatientId != 0) {
            Patient storage bestPatient = patients[bestPatientId];
            bestPatient.isMatched = true;
            bestPatient.matchedDonorId = donor.id;
            
            donor.isMatched = true;
            donor.matchedPatientId = bestPatient.id;

            emit MatchFound(bestPatient.id, donor.id, bestPatient.neededOrgan, bestPatient.bloodType, donor.bloodType);
        }
    }

    function _isBloodCompatible(BloodType donorBlood, BloodType recipientBlood) internal pure returns (bool) {
        if (donorBlood == BloodType.O_Neg) {
            return true;
        } else if (donorBlood == BloodType.O_Pos) {
            return (recipientBlood == BloodType.O_Pos || recipientBlood == BloodType.A_Pos || recipientBlood == BloodType.B_Pos || recipientBlood == BloodType.AB_Pos);
        } else if (donorBlood == BloodType.A_Neg) {
            return (recipientBlood == BloodType.A_Neg || recipientBlood == BloodType.A_Pos || recipientBlood == BloodType.AB_Neg || recipientBlood == BloodType.AB_Pos);
        } else if (donorBlood == BloodType.A_Pos) {
            return (recipientBlood == BloodType.A_Pos || recipientBlood == BloodType.AB_Pos);
        } else if (donorBlood == BloodType.B_Neg) {
            return (recipientBlood == BloodType.B_Neg || recipientBlood == BloodType.B_Pos || recipientBlood == BloodType.AB_Neg || recipientBlood == BloodType.AB_Pos);
        } else if (donorBlood == BloodType.B_Pos) {
            return (recipientBlood == BloodType.B_Pos || recipientBlood == BloodType.AB_Pos);
        } else if (donorBlood == BloodType.AB_Neg) {
            return (recipientBlood == BloodType.AB_Neg || recipientBlood == BloodType.AB_Pos);
        } else if (donorBlood == BloodType.AB_Pos) {
            return (recipientBlood == BloodType.AB_Pos);
        }
        return false;
    }

    function getPatients() public view returns (Patient[] memory) {
        Patient[] memory allPatients = new Patient[](patientCount);
        for (uint256 i = 0; i < patientCount; i++) {
            allPatients[i] = patients[patientIds[i]];
        }
        return allPatients;
    }
    
    function getDonors() public view returns (Donor[] memory) {
        Donor[] memory allDonors = new Donor[](donorCount);
        for (uint256 i = 0; i < donorCount; i++) {
            allDonors[i] = donors[donorIds[i]];
        }
        return allDonors;
    }
}
