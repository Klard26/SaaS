import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import providersRouter from "./providers";
import servicesRouter from "./services";
import serviceTemplatesRouter from "./serviceTemplates";
import availabilityRouter from "./availability";
import bookingsRouter from "./bookings";
import reviewsRouter from "./reviews";
import aiRouter from "./ai";
import dashboardRouter from "./dashboard";
import billingRouter from "./billing";
import calendarRouter from "./calendar";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(billingRouter);
router.use(calendarRouter);
router.use(providersRouter);
router.use(serviceTemplatesRouter);
router.use(servicesRouter);
router.use(availabilityRouter);
router.use(bookingsRouter);
router.use(reviewsRouter);
router.use(aiRouter);
router.use(dashboardRouter);
router.use(storageRouter);

export default router;
