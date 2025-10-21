const InvestmentsService =  require("../../services/investments/InvestmentsService")

class InvestmentsController {
    async investInLocker (req, res) {
        return InvestmentsService.investInLocker(req, res);
    }

    async listInvestments (req, res) {
        return InvestmentsService.listInvestments(req, res);
    }
    async listUserInvestments (req, res) {
        return InvestmentsService.listUserInvestments(req, res);
    }
};

module.exports = new InvestmentsController();