import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("OrganDonation", function () {
    let organDonation;
    let owner, addr1, addr2, addr3;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const OrganDonation = await ethers.getContractFactory("OrganDonation");
        organDonation = await OrganDonation.deploy();
    });

    it("Should register a patient correctly", async function () {
        // OrganType Heart (0), BloodType O_Pos (1), urgencyScore 50
        await organDonation.connect(addr1).addPatient("ID1", "Alice", 0, 1, 50);
        const patientCount = await organDonation.patientCount();
        expect(patientCount).to.equal(1n);

        const patients = await organDonation.getPatients();
        expect(patients[0].name).to.equal("Alice");
        expect(patients[0].nationalId).to.equal("ID1");
        expect(patients[0].neededOrgan).to.equal(0n);
        expect(patients[0].bloodType).to.equal(1n);
        expect(patients[0].urgencyScore).to.equal(50n);
        expect(patients[0].isMatched).to.equal(false);
    });

    it("Should match a donor to a patient with compatible organ and blood type", async function () {
        // Patient needs Heart (0), O_Pos (1), urgencyScore 50
        await organDonation.connect(addr1).addPatient("ID2", "Alice", 0, 1, 50);

        // Donor gives Heart (0), O_Neg (0) - O_Neg is universal donor so compatible
        await organDonation.connect(addr2).registerDonor("Bob", 0, 0);

        const patients = await organDonation.getPatients();
        const donors = await organDonation.getDonors();

        expect(patients[0].isMatched).to.equal(true);
        expect(patients[0].matchedDonorId).to.equal(donors[0].id);

        expect(donors[0].isMatched).to.equal(true);
        expect(donors[0].matchedPatientId).to.equal(patients[0].id);
    });

    it("Should NOT match if blood type is incompatible", async function () {
        // Patient needs Heart (0), O_Neg (0), urgencyScore 50
        await organDonation.connect(addr1).addPatient("ID3", "Alice", 0, 0, 50);

        // Donor gives Heart (0), AB_Pos (7) - Not compatible with O_Neg
        await organDonation.connect(addr2).registerDonor("Bob", 0, 7);

        const patients = await organDonation.getPatients();
        const donors = await organDonation.getDonors();

        expect(patients[0].isMatched).to.equal(false);
        expect(donors[0].isMatched).to.equal(false);
    });

    it("Should NOT match if organ type is incompatible", async function () {
        // Patient needs Liver (1), O_Pos (1), urgencyScore 50
        await organDonation.connect(addr1).addPatient("ID4", "Alice", 1, 1, 50);

        // Donor gives Heart (0), O_Pos (1) - Not the same organ
        await organDonation.connect(addr2).registerDonor("Bob", 0, 1);

        const patients = await organDonation.getPatients();
        const donors = await organDonation.getDonors();

        expect(patients[0].isMatched).to.equal(false);
        expect(donors[0].isMatched).to.equal(false);
    });

    it("Should prioritize patients with higher urgencyScore", async function () {
        // Patient 1 needs Heart (0), O_Pos (1), urgencyScore 30
        await organDonation.connect(addr1).addPatient("ID5", "Alice", 0, 1, 30);

        // Patient 2 needs Heart (0), O_Pos (1), urgencyScore 90 (more urgent)
        await organDonation.connect(addr2).addPatient("ID6", "Charlie", 0, 1, 90);

        // Donor gives Heart (0), O_Neg (0)
        await organDonation.connect(addr3).registerDonor("Bob", 0, 0);

        const patients = await organDonation.getPatients();
        const donors = await organDonation.getDonors();

        // Alice should still be waiting
        expect(patients[0].isMatched).to.equal(false);

        // Charlie should be matched because he had higher urgency
        expect(patients[1].isMatched).to.equal(true);
        expect(patients[1].matchedDonorId).to.equal(donors[0].id);

        expect(donors[0].isMatched).to.equal(true);
        expect(donors[0].matchedPatientId).to.equal(patients[1].id);
    });
});
